import { getConnection } from './db.js';

/**
 * Automatically creates the PostgreSQL database schema (tables, extensions, and vector indexes)
 * if they do not exist. Ensures a zero-config setup on Supabase/Neon.
 */
export async function initializeSchema() {
  let connection;
  try {
    connection = await getConnection();

    console.log('📦 Checking and initializing PostgreSQL Database Schema...');

    // 1. Enable the pgvector extension
    await connection.query('CREATE EXTENSION IF NOT EXISTS vector;');

    // 2. Create study_materials table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS study_materials (
        id SERIAL PRIMARY KEY,
        filename VARCHAR(255) NOT NULL,
        mime_type VARCHAR(100) NOT NULL,
        uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 2b. Per-user ownership so one user can never read another user's uploads
    await connection.query(`ALTER TABLE study_materials ADD COLUMN IF NOT EXISTS user_id VARCHAR(64);`);
    await connection.query(`CREATE INDEX IF NOT EXISTS study_materials_user_idx ON study_materials (user_id, uploaded_at DESC);`);

    // 3. Create document_chunks table with vector(768) column type
    await connection.query(`
      CREATE TABLE IF NOT EXISTS document_chunks (
        id SERIAL PRIMARY KEY,
        material_id INT REFERENCES study_materials(id) ON DELETE CASCADE,
        chunk_index INT NOT NULL,
        content TEXT NOT NULL,
        embedding VECTOR(768) NOT NULL,
        page_number INT
      );
    `);

    await connection.query(`CREATE INDEX IF NOT EXISTS document_chunks_material_idx ON document_chunks (material_id, chunk_index);`);

    // 4. Create native HNSW index for high-speed cosine similarity searches
    await connection.query(`
      CREATE INDEX IF NOT EXISTS document_chunks_embedding_idx ON document_chunks 
      USING hnsw (embedding vector_cosine_ops);
    `);

    // 5. Enable RLS + deny-all PostgREST access (backend uses privileged pool role which bypasses RLS)
    await connection.query(`ALTER TABLE IF EXISTS study_materials ENABLE ROW LEVEL SECURITY;`);
    await connection.query(`ALTER TABLE IF EXISTS document_chunks ENABLE ROW LEVEL SECURITY;`);

    // 6. Create quiz_results table to persist final leaderboards across restarts
    await connection.query(`
      CREATE TABLE IF NOT EXISTS quiz_results (
        id SERIAL PRIMARY KEY,
        room_code VARCHAR(50) NOT NULL,
        quiz_title VARCHAR(255) NOT NULL,
        difficulty VARCHAR(50) NOT NULL DEFAULT 'medium',
        total_questions INT NOT NULL DEFAULT 0,
        leaderboard JSONB NOT NULL DEFAULT '[]',
        finished_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Index for fast lookup by room_code
    await connection.query(`
      CREATE INDEX IF NOT EXISTS quiz_results_room_code_idx ON quiz_results (room_code);
    `);

    // Enable RLS on quiz_results
    await connection.query(`ALTER TABLE IF EXISTS quiz_results ENABLE ROW LEVEL SECURITY;`);

    console.log('✅ PostgreSQL Schema initialized successfully (Tables & Vector indexes ready).');

  } catch (error) {
    console.error('❌ Failed to initialize database schema:', error);
  } finally {
    if (connection) connection.release();
  }
}

/**
 * Saves metadata of an uploaded study material (PDF/Image) to the database.
 * 
 * @param {string} filename - The name of the file.
 * @param {string} mimeType - The MIME type of the file.
 * @param {string|null} userId - Owner (Supabase user id).
 * @returns {Promise<number>} The generated material ID.
 */
export async function saveMaterial(filename, mimeType, userId = null) {
  let connection;
  try {
    connection = await getConnection();
    
    const query = `
      INSERT INTO study_materials (filename, mime_type, user_id)
      VALUES ($1, $2, $3)
      RETURNING id;
    `;

    const result = await connection.query(query, [filename, mimeType, userId ? String(userId) : null]);
    const materialId = result.rows[0].id;
    return materialId;

  } catch (error) {
    console.error('Error in saveMaterial DB operation:', error);
    throw error;
  } finally {
    if (connection) connection.release();
  }
}

/**
 * Saves a single parsed text chunk and its corresponding float vector embedding.
 * Converts the float array embedding into the format string "[0.1, -0.2, ...]" required by pgvector.
 * 
 * @param {number} materialId - Foreign key referencing study_materials(id).
 * @param {number} chunkIndex - Order position index of this chunk.
 * @param {string} content - Text content.
 * @param {number[]} embedding - 768-dimensional float array embedding.
 * @param {number|null} [pageNumber=null] - Optional page number.
 * @returns {Promise<void>}
 */
export async function saveChunk(materialId, chunkIndex, content, embedding, pageNumber = null) {
  let connection;
  try {
    connection = await getConnection();

    if (!Array.isArray(embedding) || embedding.length !== 768) {
      throw new Error(`Embedding must be an array of length 768. Received length: ${embedding?.length}`);
    }
    
    // pgvector parses standard stringified JSON array formats: "[0.1, 0.2, ...]"
    const vectorStr = `[${embedding.join(',')}]`;

    const query = `
      INSERT INTO document_chunks (material_id, chunk_index, content, embedding, page_number)
      VALUES ($1, $2, $3, $4, $5);
    `;

    await connection.query(query, [materialId, chunkIndex, content, vectorStr, pageNumber]);

  } catch (error) {
    console.error('Error in saveChunk DB operation:', error);
    throw error;
  } finally {
    if (connection) connection.release();
  }
}

/**
 * Saves all chunks of a material in ONE transaction (one round trip per chunk batch, all-or-nothing).
 * @param {number} materialId
 * @param {{content: string, embedding: number[]}[]} items - in chunk order
 */
export async function saveChunksBulk(materialId, items) {
  let connection;
  try {
    connection = await getConnection();
    await connection.query('BEGIN');
    for (let i = 0; i < items.length; i++) {
      const { content, embedding } = items[i];
      if (!Array.isArray(embedding) || embedding.length !== 768) {
        throw new Error(`Embedding must be an array of length 768. Received length: ${embedding?.length}`);
      }
      await connection.query(
        'INSERT INTO document_chunks (material_id, chunk_index, content, embedding, page_number) VALUES ($1, $2, $3, $4, NULL)',
        [materialId, i, content, `[${embedding.join(',')}]`]
      );
    }
    await connection.query('COMMIT');
  } catch (error) {
    if (connection) await connection.query('ROLLBACK').catch(() => {});
    throw error;
  } finally {
    if (connection) connection.release();
  }
}

/** Deletes a material (chunks cascade). Used to clean up after a failed ingest. */
export async function deleteMaterial(materialId) {
  let connection;
  try {
    connection = await getConnection();
    await connection.query('DELETE FROM study_materials WHERE id = $1', [Number(materialId)]);
  } catch (error) {
    console.error('Error in deleteMaterial DB operation:', error);
  } finally {
    if (connection) connection.release();
  }
}

/** Returns the id of the user's most recent material, or null. */
export async function getLatestMaterialId(userId) {
  let connection;
  try {
    connection = await getConnection();
    const r = await connection.query(
      'SELECT id FROM study_materials WHERE user_id = $1 ORDER BY uploaded_at DESC, id DESC LIMIT 1',
      [String(userId)]
    );
    return r.rows[0]?.id ?? null;
  } finally {
    if (connection) connection.release();
  }
}

/** Returns true only if the material exists and belongs to this user. */
export async function userOwnsMaterial(userId, materialId) {
  let connection;
  try {
    connection = await getConnection();
    const r = await connection.query(
      'SELECT 1 FROM study_materials WHERE id = $1 AND user_id = $2',
      [Number(materialId), String(userId)]
    );
    return r.rows.length > 0;
  } finally {
    if (connection) connection.release();
  }
}

/**
 * Persists a finished quiz result (leaderboard) to the database.
 * 
 * @param {string} roomCode - The room code.
 * @param {string} quizTitle - Title of the quiz.
 * @param {string} difficulty - Quiz difficulty level.
 * @param {number} totalQuestions - Total number of questions.
 * @param {Array} leaderboard - Sorted array of player results.
 * @returns {Promise<number>} The inserted result ID.
 */
export async function saveQuizResult(roomCode, quizTitle, difficulty, totalQuestions, leaderboard) {
  let connection;
  try {
    connection = await getConnection();

    const query = `
      INSERT INTO quiz_results (room_code, quiz_title, difficulty, total_questions, leaderboard)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id;
    `;

    const result = await connection.query(query, [roomCode, quizTitle, difficulty, totalQuestions, JSON.stringify(leaderboard)]);
    const resultId = result.rows[0].id;
    return resultId;

  } catch (error) {
    console.error('Error in saveQuizResult DB operation:', error);
    throw error;
  } finally {
    if (connection) connection.release();
  }
}

/**
 * Performs a vector similarity search in the database using the Cosine distance operator (<=>).
 * Joins study_materials to fetch the source document filename for reference pathing.
 * 
 * @param {number[]} queryEmbedding - 768-dimensional query float array embedding.
 * @param {number} [limit=5] - Number of top relevant matches to retrieve.
 * @param {number|null} [materialId=null] - Optional document filter.
 * @returns {Promise<Object[]>} Array of matching document chunks with similarity scores.
 */
export async function searchSimilarChunks(queryEmbedding, limit = 5, materialId = null) {
  let connection;
  try {
    connection = await getConnection();

    if (!Array.isArray(queryEmbedding) || queryEmbedding.length !== 768) {
      throw new Error(`Query embedding must be an array of length 768. Received length: ${queryEmbedding?.length}`);
    }
    
    const vectorStr = `[${queryEmbedding.join(',')}]`;

    // Postgres <=> operator computes Cosine Distance between vectors.
    // Smaller distance = higher similarity.
    let query = `
      SELECT c.id, c.content, c.page_number, c.chunk_index, m.filename,
             (c.embedding <=> $1) AS distance
      FROM document_chunks c
      JOIN study_materials m ON c.material_id = m.id
    `;

    const params = [vectorStr];

    if (materialId) {
      query += ` WHERE c.material_id = $2 `;
      params.push(Number(materialId));
      query += ` ORDER BY distance ASC LIMIT $3 `;
      params.push(limit);
    } else {
      query += ` ORDER BY distance ASC LIMIT $2 `;
      params.push(limit);
    }

    const result = await connection.query(query, params);
    
    // Map return key properties to match original output expected by the APIs
    return result.rows.map(row => ({
      id: row.id,
      content: row.content,
      pageNumber: row.page_number,
      chunkIndex: row.chunk_index,
      filename: row.filename,
      distance: Number(row.distance)
    }));

  } catch (error) {
    console.error('Error in searchSimilarChunks DB operation:', error);
    throw error;
  } finally {
    if (connection) connection.release();
  }
}
