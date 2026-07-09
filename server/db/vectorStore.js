import oracledb from 'oracledb';
import { getConnection } from './db.js';

/**
 * Saves metadata of an uploaded study material (PDF/Image) to the database.
 * Uses the RETURNING clause to retrieve the auto-generated identity primary key ID.
 * 
 * @param {string} filename - The name of the file.
 * @param {string} mimeType - The MIME type of the file.
 * @returns {Promise<number>} The generated material ID.
 */
export async function saveMaterial(filename, mimeType) {
  let connection;
  try {
    connection = await getConnection();
    
    const query = `
      INSERT INTO study_materials (filename, mime_type)
      VALUES (:filename, :mimeType)
      RETURNING id INTO :outId
    `;

    const binds = {
      filename,
      mimeType,
      outId: { type: oracledb.NUMBER, dir: oracledb.BIND_OUT }
    };

    const result = await connection.execute(query, binds, { autoCommit: true });
    
    // Grab the returned ID from BIND_OUT array
    const materialId = result.outBinds.outId[0];
    return materialId;

  } catch (error) {
    console.error('Error in saveMaterial DB operation:', error);
    throw error;
  } finally {
    if (connection) {
      try {
        await connection.close();
      } catch (err) {
        console.error('Error closing connection in saveMaterial:', err);
      }
    }
  }
}

/**
 * Saves a single parsed text chunk and its corresponding float vector embedding.
 * Converts the float array embedding into the format string "[0.1, -0.2, ...]" required by Oracle.
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

    // Convert vector embedding float array into Oracle's vector string representation format: "[v1,v2,v3...]"
    if (!Array.isArray(embedding) || embedding.length !== 768) {
      throw new Error(`Embedding must be an array of length 768. Received length: ${embedding?.length}`);
    }
    const vectorStr = `[${embedding.join(',')}]`;

    const query = `
      INSERT INTO document_chunks (material_id, chunk_index, content, embedding, page_number)
      VALUES (:materialId, :chunkIndex, :content, :embedding, :pageNumber)
    `;

    const binds = {
      materialId,
      chunkIndex,
      content, // CLOB automatically handled by oracledb thick/thin client binding
      embedding: vectorStr,
      pageNumber
    };

    await connection.execute(query, binds, { autoCommit: true });

  } catch (error) {
    console.error('Error in saveChunk DB operation:', error);
    throw error;
  } finally {
    if (connection) {
      try {
        await connection.close();
      } catch (err) {
        console.error('Error closing connection in saveChunk:', err);
      }
    }
  }
}

/**
 * Performs a vector similarity search in the database using the Cosine distance metric.
 * Joins study_materials to fetch the source document filename for reference pathing.
 * 
 * @param {number[]} queryEmbedding - 768-dimensional query float array embedding.
 * @param {number} [limit=5] - Number of top relevant matches to retrieve.
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

    const binds = {
      queryEmbedding: vectorStr,
      limitRows: limit
    };

    let query = `
      SELECT c.id, c.content, c.page_number, c.chunk_index, m.filename,
             VECTOR_DISTANCE(c.embedding, :queryEmbedding, COSINE) AS distance
      FROM document_chunks c
      JOIN study_materials m ON c.material_id = m.id
    `;

    if (materialId) {
      query += ` WHERE c.material_id = :materialId `;
      binds.materialId = Number(materialId);
    }

    query += `
      ORDER BY distance ASC
      FETCH FIRST :limitRows ROWS ONLY
    `;

    const result = await connection.execute(query, binds);
    return result.rows;

  } catch (error) {
    console.error('Error in searchSimilarChunks DB operation:', error);
    throw error;
  } finally {
    if (connection) {
      try {
        await connection.close();
      } catch (err) {
        console.error('Error closing connection in searchSimilarChunks:', err);
      }
    }
  }
}
