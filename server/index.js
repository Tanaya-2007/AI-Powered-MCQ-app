import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import multer from 'multer';
import oracledb from 'oracledb';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { initDbPool, closeDbPool } from './db/db.js';
import { extractTextFromFile } from './utils/parser.js';
import { splitText } from './utils/textSplitter.js';
import { generateEmbedding } from './utils/gemini.js';
import { saveMaterial, saveChunk, searchSimilarChunks } from './db/vectorStore.js';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { hasGoogleCredentials, createGoogleForm } from './utils/googleForms.js';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Initialize Gemini Client
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || 'dummy-key');

// Resolve __dirname in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure uploads folder exists
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure CORS to allow connection from the React frontend
app.use(cors({
  origin: ['http://localhost:5173', 'http://127.0.0.1:5173'],
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Configure Multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB Limit
});

// Configure OracleDB Thin connection mode (default in v6+)
oracledb.outFormat = oracledb.OUT_FORMAT_OBJECT;

// --- API ROUTES ---

// 1. Status Check Endpoint
app.get('/api/status', (req, res) => {
  res.json({
    status: 'OK',
    message: 'QuizMaster backend server is running successfully.',
    timestamp: new Date().toISOString(),
    geminiKeyConfigured: !!process.env.GEMINI_API_KEY,
    oracleConfigured: !!(process.env.DB_USER && process.env.DB_PASSWORD && process.env.DB_CONNECTION_STRING)
  });
});

// 2. Oracle Database Connectivity Check Endpoint
app.get('/api/db-check', async (req, res) => {
  const user = process.env.DB_USER;
  const password = process.env.DB_PASSWORD;
  const connectString = process.env.DB_CONNECTION_STRING;

  if (!user || !password || !connectString) {
    return res.status(400).json({
      success: false,
      message: 'Database credentials are missing in the .env file. Please edit server/.env and fill in DB_USER, DB_PASSWORD, and DB_CONNECTION_STRING.'
    });
  }

  let connection;
  try {
    // Attempt standard thin connection
    connection = await oracledb.getConnection({
      user,
      password,
      connectString
    });

    // Run a simple test query (e.g. check current sysdate or user)
    const result = await connection.execute('SELECT user, sysdate FROM dual');

    res.json({
      success: true,
      message: 'Successfully connected to Oracle Database!',
      details: {
        dbUser: result.rows[0].USER,
        dbSysdate: result.rows[0].SYSDATE
      }
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to connect to Oracle Database.',
      error: error.message
    });
  } finally {
    if (connection) {
      try {
        await connection.close();
      } catch (err) {
        console.error('Error closing database connection:', err);
      }
    }
  }
});

// 3. Document Ingestion Endpoint (Extract -> Chunk -> Embed -> Oracle Vector DB)
app.post('/api/ingest', upload.single('file'), async (req, res) => {
  let filePath = null;
  try {
    let filename;
    let mimeType;
    let rawText;

    // Check if user uploaded a file OR sent plain text in request body
    if (req.file) {
      filePath = req.file.path;
      filename = req.file.originalname;
      mimeType = req.file.mimetype;

      console.log(`📥 Ingesting file: ${filename} (${mimeType})`);
      
      // Step A: Extract text from file (Handles plain text, PDF, and Image OCR)
      rawText = await extractTextFromFile(filePath, mimeType);
    } else if (req.body.text && req.body.filename) {
      filename = req.body.filename;
      mimeType = 'text/plain';
      rawText = req.body.text;

      console.log(`📥 Ingesting copy-pasted text: ${filename}`);
    } else {
      return res.status(400).json({
        success: false,
        message: 'No study material provided. Please upload a file (PDF/Image) or send plain text.'
      });
    }

    if (!rawText || rawText.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Text extraction returned empty content. Ensure the file has readable text.'
      });
    }

    // Step B: Partition extracted text into semantic overlapping chunks
    const chunks = splitText(rawText);
    console.log(`✂️ Text partitioned into ${chunks.length} chunks.`);

    // Step C: Save parent material metadata and retrieve generated ID
    const materialId = await saveMaterial(filename, mimeType);
    console.log(`💾 Material record saved under ID: ${materialId}`);

    // Step D: Calculate embedding vector for each chunk and save to Vector DB
    let processedChunksCount = 0;
    for (let i = 0; i < chunks.length; i++) {
      const chunkText = chunks[i];
      
      // Calculate 768-dimension semantic vector via Gemini API
      const embedding = await generateEmbedding(chunkText);

      // Save chunk text and float array vector to Oracle
      await saveChunk(materialId, i, chunkText, embedding, null);
      processedChunksCount++;
    }

    console.log(`✅ Ingestion pipeline complete. Processed ${processedChunksCount} chunks.`);
    res.json({
      success: true,
      message: 'Study material successfully ingested and embedded!',
      materialId,
      filename,
      chunksCount: processedChunksCount
    });

  } catch (error) {
    console.error('❌ Ingestion pipeline failed:', error);
    res.status(500).json({
      success: false,
      message: 'Ingestion pipeline failed.',
      error: error.message
    });
  } finally {
    // Step E: Clean up temporary file from disk uploads folder
    if (filePath && fs.existsSync(filePath)) {
      try {
        fs.unlinkSync(filePath);
        console.log(`🗑️ Deleted temporary file: ${filePath}`);
      } catch (err) {
        console.error('Failed to delete temporary file:', err);
      }
    }
  }
});

// 4. AI Quiz Generation Endpoint (Semantic Search + Gemini MCQ Creator)
app.post('/api/generate-quiz', async (req, res) => {
  const { topic, materialId, count = 5, difficulty = 'medium' } = req.body;

  if (!topic || topic.trim() === '') {
    return res.status(400).json({ success: false, message: 'Topic name is required.' });
  }

  let contextText = '';
  let fallback = false;

  console.log(`🔍 Received quiz generation request for topic: "${topic}" (Difficulty: ${difficulty}, Count: ${count})`);

  try {
    // A. Generate embedding for query topic
    const queryEmbedding = await generateEmbedding(topic);

    // B. Query vector store for matching textbook segments
    const chunks = await searchSimilarChunks(queryEmbedding, 5, materialId);

    if (chunks && chunks.length > 0) {
      console.log(`✅ Found ${chunks.length} semantically relevant chunks in vector DB.`);
      contextText = chunks
        .map(c => `[From textbook: ${c.FILENAME}, page ${c.PAGE_NUMBER || 'unknown'}]:\n${c.CONTENT}`)
        .join('\n\n---\n\n');
    } else {
      console.log('⚠️ No matching segments found in Vector store. Falling back to general knowledge.');
      fallback = true;
    }
  } catch (error) {
    console.warn('⚠️ Vector store retrieval skipped/failed. Falling back to general knowledge. Detail:', error.message);
    fallback = true;
  }

  // C. Build the prompt for Gemini
  try {
    const model = genAI.getGenerativeModel({
      model: 'gemini-1.5-flash',
      generationConfig: {
        responseMimeType: 'application/json'
      }
    });

    let prompt = '';
    if (fallback) {
      prompt = `
        You are an expert educator. Your task is to generate a multiple-choice quiz based on your general knowledge.
        
        Topic to focus on: "${topic}"
        Difficulty level: "${difficulty}"
        Number of questions required: ${count}
        
        INSTRUCTIONS:
        1. Generate exactly ${count} multiple-choice questions focusing on the topic "${topic}".
        2. Align the questions to the "${difficulty}" difficulty level.
        3. Every question must have:
           - "question": string text
           - "options": an array of exactly 4 strings
           - "correctAnswer": number index (0, 1, 2, or 3) representing the correct option in the options array
           - "explanation": a detailed explanation of why that option is correct.
        4. Respond ONLY with a valid JSON array of objects. Do not include markdown code block formatting, no introductory text, and no conversational text.
        
        JSON Array Schema:
        [
          {
            "question": "question text",
            "options": ["option A", "option B", "option C", "option D"],
            "correctAnswer": 0,
            "explanation": "explanation details"
          }
        ]
      `;
    } else {
      prompt = `
        You are an expert educator. Your task is to generate a multiple-choice quiz based on the textbook segments provided below.
        
        Topic to focus on: "${topic}"
        Difficulty level: "${difficulty}"
        Number of questions required: ${count}
        
        CONTEXT SEGMENTS FROM TEXTBOOK:
        ===
        ${contextText}
        ===
        
        INSTRUCTIONS:
        1. Generate exactly ${count} multiple-choice questions focusing on the topic "${topic}".
        2. Use the provided context segments to source the questions and explanations. If the context does not contain enough information, you may supplement it with your general knowledge, but prioritize the context.
        3. Align the questions to the "${difficulty}" difficulty level.
        4. Every question must have:
           - "question": string text
           - "options": an array of exactly 4 strings
           - "correctAnswer": number index (0, 1, 2, or 3) representing the correct option in the options array
           - "explanation": a detailed explanation of why that option is correct, referencing concepts from the context.
        5. Respond ONLY with a valid JSON array of objects. Do not include markdown code block formatting, no introductory text, and no conversational text.
        
        JSON Array Schema:
        [
          {
            "question": "question text",
            "options": ["option A", "option B", "option C", "option D"],
            "correctAnswer": 0,
            "explanation": "explanation details"
          }
        ]
      `;
    }

    const result = await model.generateContent(prompt);
    const responseText = result.response.text();
    
    // Parse response
    const questions = JSON.parse(responseText);

    console.log(`🎉 Successfully generated ${questions.length} questions.`);
    res.json({
      success: true,
      fallback,
      questions
    });

  } catch (error) {
    console.error('❌ Failed to generate quiz with Gemini:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate quiz.',
      error: error.message
    });
  }
});

// 5. Google Forms Export Endpoint (Creates a graded Quiz in Google Forms)
app.post('/api/export-quiz', async (req, res) => {
  const { title, questions } = req.body;

  if (!title || title.trim() === '') {
    return res.status(400).json({ success: false, message: 'Quiz title is required.' });
  }

  if (!questions || !Array.isArray(questions) || questions.length === 0) {
    return res.status(400).json({ success: false, message: 'Questions list is required and cannot be empty.' });
  }

  // Check if user has configured service account credentials
  if (!hasGoogleCredentials()) {
    console.log('⚠️ Google Forms Credentials missing. Returning interactive setup guide.');
    return res.json({
      success: false,
      setupRequired: true,
      message: 'Google Cloud credentials are not configured yet on the backend.',
      setupSteps: [
        '1. Go to Google Cloud Console (https://console.cloud.google.com).',
        '2. Create a new Google Cloud Project.',
        '3. Go to APIs & Services Library and enable "Google Forms API" and "Google Drive API".',
        '4. Go to APIs & Services -> Credentials and click "Create Credentials" -> "Service Account".',
        '5. Create a key for this Service Account in JSON format and download it.',
        '6. Rename the downloaded file to "google-credentials.json" and place it in the "/server" folder.',
        '7. Share your Google Drive folder or allow access to the service account email (usually looks like user@project.iam.gserviceaccount.com) if you want to organize it, or just use the generated forms directly.'
      ]
    });
  }

  try {
    const result = await createGoogleForm(title, questions);
    res.json({
      success: true,
      message: 'Form successfully created and exported to Google Forms!',
      formId: result.formId,
      formUrl: result.formUrl
    });
  } catch (error) {
    console.error('❌ Failed to export to Google Forms:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to export to Google Forms.',
      error: error.message
    });
  }
});

// Start Server
app.listen(PORT, async () => {
  console.log(`🚀 QuizMaster server listening on port ${PORT}`);
  console.log(`🔗 Status endpoint: http://localhost:${PORT}/api/status`);
  console.log(`🔗 Database test endpoint: http://localhost:${PORT}/api/db-check`);
  
  // Initialize Oracle DB Connection Pool on boot
  try {
    await initDbPool();
  } catch (error) {
    console.error('⚠️ Could not initialize DB Pool on startup. Ensure configurations are set in .env.');
  }
});

// Graceful shutdown
const gracefulShutdown = async () => {
  console.log('\nStopping server gracefully...');
  await closeDbPool();
  process.exit(0);
};

process.on('SIGINT', gracefulShutdown);
process.on('SIGTERM', gracefulShutdown);
