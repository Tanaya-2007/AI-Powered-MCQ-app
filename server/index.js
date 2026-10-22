import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { initDbPool, closeDbPool, registerSchemaInitializer } from './db/db.js';
import { extractTextFromFile } from './utils/parser.js';
import { splitText } from './utils/textSplitter.js';
import { generateEmbedding } from './utils/gemini.js';
import { saveMaterial, saveChunk, searchSimilarChunks, initializeSchema } from './db/vectorStore.js';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { generateGroqContent } from './utils/groq.js';
import { generateOpenAIContent } from './utils/openai.js';
import { hasGoogleCredentials, createGoogleForm } from './utils/googleForms.js';
import { requireAuth, verifySocketToken, isAuthEnforced } from './middleware/requireAuth.js';
import {
  ALLOWED_DIFFICULTIES,
  MAX_ROOMS,
  MAX_PLAYERS_PER_ROOM,
  sanitizeRoomCode,
  sanitizePlayerName,
  sanitizeAvatar,
  clampTimePerQuestion,
  clampQuestionCount,
  normalizeDifficulty,
  sanitizeQuestionsForRoom,
  isValidEmail,
} from './utils/validation.js';
import {
  getRoom,
  setRoom,
  hasRoom,
  deleteRoom,
  getRoomCount,
  getAllRooms,
} from './db/roomStore.js';
import { logger, httpLogger } from './utils/logger.js';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5001;

// Wrap Express app inside HTTP server to support WebSockets (Socket.io)
// CORS locked to explicit frontend allowlist (no wildcard in production).
const defaultOrigins = [
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://localhost:3000',
  'http://127.0.0.1:3000',
];
const envOrigins = (process.env.FRONTEND_URL || '')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);
const allowedOrigins = [...new Set([...defaultOrigins, ...envOrigins])];

function isOriginAllowed(origin) {
  if (!origin) return true; // curl / mobile / server-to-server
  return allowedOrigins.includes(origin);
}

const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: isOriginAllowed,
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

// Active multiplayer quiz rooms are managed by roomStore (Upstash Redis + Resilient In-Memory Fallback)

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

// Configure CORS to allow only known frontend origins (local dev + FRONTEND_URL)
app.use(cors({
  origin: isOriginAllowed,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
}));

app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));
app.use(helmet());
app.use(httpLogger);

// Rate limiting (fail-closed abuse protection for LLM/costly endpoints)
const isProd = process.env.NODE_ENV === 'production';
const writeLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isProd ? 30 : 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests. Please try again later.' },
});
const contactLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: isProd ? 10 : 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many messages. Please try again later.' },
});
const dbCheckLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isProd ? 20 : 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests. Please try again later.' },
});

// Shared validation helpers live in utils/validation.js (imported above; unit-tested).
// Room/question caps: MAX_ROOMS, MAX_PLAYERS_PER_ROOM, MAX_QUESTIONS_PER_REQUEST.

function prodMessage(message) {
  return isProd ? 'Request failed. Please try again later.' : message;
}

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
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB Limit
  fileFilter: (req, file, cb) => {
    const allowed = ['application/pdf', 'text/plain'];
    const isImage = file.mimetype && file.mimetype.startsWith('image/');
    const isPdfName = file.originalname && file.originalname.toLowerCase().endsWith('.pdf');
    if (allowed.includes(file.mimetype) || isImage || isPdfName) return cb(null, true);
    cb(new Error('Unsupported file type. Upload PDF, image, or text only.'));
  },
});

// --- API ROUTES ---

// 1. Status Check Endpoint (minimal fingerprint in production)
app.get('/api/status', (req, res) => {
  const base = {
    status: 'OK',
    message: 'QuizMaster backend server is running successfully.',
    timestamp: new Date().toISOString(),
  };
  if (isProd) return res.json(base);
  res.json({
    ...base,
    geminiKeyConfigured: !!process.env.GEMINI_API_KEY,
    dbConfigured: !!(process.env.DATABASE_URL || process.env.DB_CONNECTION_STRING),
    authEnforced: isAuthEnforced()
  });
});

// 2. Database Connectivity Check Endpoint (authenticated + rate-limited)
app.get('/api/db-check', dbCheckLimiter, requireAuth, async (req, res) => {
  let connection;
  try {
    const pool = await initDbPool();
    if (!pool) {
      return res.status(400).json({
        success: false,
        message: 'PostgreSQL connection credentials are missing in server/.env.'
      });
    }

    connection = await pool.connect();
    const result = await connection.query('SELECT NOW()');

    res.json({
      success: true,
      message: 'Successfully connected to PostgreSQL Database!',
      details: {
        now: result.rows[0].now
      }
    });

  } catch (error) {
    console.error('❌ Database check failed.');
    res.status(500).json({
      success: false,
      message: 'Failed to connect to PostgreSQL Database.'
    });
  } finally {
    if (connection) {
      try {
        connection.release();
      } catch (err) {
        console.error('Error releasing database connection:', err);
      }
    }
  }
});

// 3. Document Ingestion Endpoint (Extract -> Chunk -> Embed -> Vector DB)
app.post('/api/ingest', writeLimiter, requireAuth, upload.single('file'), async (req, res) => {
  let filePath = null;
  try {
    let filename;
    let mimeType;
    let rawText;

    // Check if user uploaded a file OR sent plain text in request body
    if (req.file) {
      filePath = req.file.path;
      filename = String(req.file.originalname || 'upload').slice(0, 255);
      mimeType = req.file.mimetype;

      console.log(`📥 Ingesting file: ${filename} (${mimeType})`);

      // Step A: Extract text from file (Handles plain text, PDF, and Image OCR)
      rawText = await extractTextFromFile(filePath, mimeType);
    } else if (req.body.text && req.body.filename) {
      filename = String(req.body.filename).slice(0, 255);
      mimeType = 'text/plain';
      rawText = String(req.body.text).slice(0, 200000); // bound embedding cost per request

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
    // A quick local length check to avoid calling APIs on completely empty/useless input
    if (!rawText || rawText.trim().length < 5) {
      return res.status(400).json({
        success: false,
        errorType: 'INSUFFICIENT_CONTENT',
        message: 'Please provide some study material first.'
      });
    }

    const topic = typeof req.body.topic === 'string' ? req.body.topic.slice(0, 200) : req.body.topic;
    if (topic && topic.trim().length >= 2) {
      console.log(`🔍 Running semantic validation for topic focus: "${topic}"`);
      const model = genAI.getGenerativeModel({
        model: 'gemini-3.8-flash',
        generationConfig: { responseMimeType: 'application/json' }
      });

      const checkPrompt = `
        You are an advanced academic content analyzer and validation assistant.
        Analyze the following text extract against the selected topic focus: "${topic}".
        
        Evaluate the text for:
        1. Content Sufficiency:
           - "EMPTY": If the text is empty or just white space.
           - "INSUFFICIENT": If the text contains almost no academic or informational substance, or is just gibberish, or a generic greeting (e.g. "hey", "hello", "test"), or is too short to generate any meaningful grounded questions (e.g. just a single word like "Database" with no definition or explanation).
           - "SUFFICIENT": If the text contains at least one meaningful definition, concept, or fact (even a single sentence like "Photosynthesis converts light energy into chemical energy") from which at least one grounded question can be created.
           - "RICH": If the text contains multiple pages, rich sections, or comprehensive notes that can easily support multiple questions.
        
        2. Detected Topic:
           - Auto-detect the primary subject or topic of the text (e.g. "Database systems", "Photosynthesis", "Java programming"). Be specific.
        
        3. Topic Matching (relative to the user's selected topic: "${topic}"):
           - "EXACT": The text topic is directly and specifically the selected topic.
           - "RELATED": The text topic is a subtopic, parent topic, or closely related academic area (e.g., selected topic is "Database", text is about "SQL Normalization"; or selected topic is "Machine Learning", text is about "Neural Networks").
           - "TOO_GENERIC": The user's selected topic is too broad, generic, or short (e.g., user selected "design" but text is specifically about "System design"; or user selected "programming" but text is about "Java programming").
           - "MISMATCH": The text is completely unrelated to the selected topic (e.g. selected topic is "Database", text is about "Photosynthesis").
        
        Return ONLY a valid JSON object matching this schema:
        {
          "sufficiency": "EMPTY" | "INSUFFICIENT" | "SUFFICIENT" | "RICH",
          "sufficiencyReason": "explanation of sufficiency classification",
          "detectedTopic": "detected topic string",
          "matchType": "EXACT" | "RELATED" | "TOO_GENERIC" | "MISMATCH",
          "relationExplanation": "explanation of why it is classified as exact, related, too generic, or mismatch"
        }
        
        Text to analyze (first 4000 chars):
        """
        ${rawText.substring(0, 4000)}
        """
      `;

      try {
        let responseText;
        if (process.env.GROQ_API_KEY) {
          try {
            console.log('🤖 Running validation via Groq API...');
            responseText = await generateGroqContent(checkPrompt, 'application/json');
          } catch (groqError) {
            console.warn('⚠️ Groq validation failed, falling back to Gemini API:', groqError.message);
            console.log('🛰️ Running validation via Gemini API...');
            const checkResult = await model.generateContent(checkPrompt);
            responseText = checkResult.response.text();
          }
        } else if (process.env.OPENAI_API_KEY) {
          console.log('🤖 Running validation via OpenAI API (gpt-4o-mini)...');
          responseText = await generateOpenAIContent(checkPrompt, 'application/json');
        } else {
          console.log('🛰️ Running validation via Gemini API...');
          const checkResult = await model.generateContent(checkPrompt);
          responseText = checkResult.response.text();
        }

        const cleanJsonText = responseText.replace(/```json|```/g, '').trim();
        const checkData = JSON.parse(cleanJsonText);

        console.log('[Validation Result]', checkData);

        if (checkData.sufficiency === 'EMPTY' || checkData.sufficiency === 'INSUFFICIENT') {
          console.warn(`❌ Ingestion rejected: Insufficient content. Reason: ${checkData.sufficiencyReason}`);
          return res.status(400).json({
            success: false,
            errorType: 'INSUFFICIENT_CONTENT',
            message: checkData.sufficiencyReason || "Your study material is too short or doesn't contain enough information to generate a quiz."
          });
        }

        if (checkData.matchType === 'MISMATCH' || checkData.matchType === 'TOO_GENERIC') {
          console.warn(`❌ Ingestion rejected: Topic mismatch or too generic. Selected: "${topic}", Detected: "${checkData.detectedTopic}"`);
          return res.status(400).json({
            success: false,
            errorType: 'TOPIC_MISMATCH',
            message: checkData.matchType === 'TOO_GENERIC'
              ? `⚠️ The topic focus "${topic}" is too generic.\n\nPlease refine your Topic Focus to match the specific subject of your study material: "${checkData.detectedTopic}".`
              : `⚠️ Topic mismatch detected.\n\nYou selected: "${topic}"\nBut your uploaded content appears to be about: "${checkData.detectedTopic}".\n\nPlease either:\n• change the topic to "${checkData.detectedTopic}"\nOR\n• upload content related to "${topic}".`,
            detectedTopic: checkData.detectedTopic,
            selectedTopic: topic
          });
        }

        console.log(`✅ Content validation passed! Sufficiency: ${checkData.sufficiency}, Match Type: ${checkData.matchType}`);
      } catch (checkErr) {
        console.error('⚠️ Content validation error:', checkErr.message);

        // Report quota exceeded errors immediately
        if (checkErr.message.includes('429') || checkErr.message.includes('quota') || checkErr.message.toLowerCase().includes('quota exceeded') || checkErr.message.includes('QuotaFailure')) {
          return res.status(429).json({
            success: false,
            message: 'Your Google Gemini API Key has exceeded its quota or has been restricted (Rate Limit: 0). Please generate a new API Key in a new project on Google AI Studio or add billing to your current project.'
          });
        }

        // Report network connection failures immediately
        if (checkErr.message.includes('fetch failed') || checkErr.message.includes('network socket') || checkErr.message.includes('ECONNRESET')) {
          return res.status(503).json({
            success: false,
            message: 'A local network connection error occurred while connecting to the Google Gemini API. Please check your internet connection or disable any active VPN/proxies.'
          });
        }

        // Resilient fallback checks:
        const textLower = rawText.trim().toLowerCase();
        const isGreeting = /^(hey|hello|hi|hii|helloo|testing)$/i.test(textLower);
        if (isGreeting || rawText.trim().length < 2) {
          return res.status(400).json({
            success: false,
            errorType: 'INSUFFICIENT_CONTENT',
            message: 'Your input is too limited to create meaningful MCQs. Please enter a topic or upload study material.'
          });
        }
      }
    }

    // Step B: Partition extracted text into semantic overlapping chunks (capped per request)
    const chunks = splitText(rawText).slice(0, 60);
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
    console.error('❌ Ingestion pipeline failed.');
    res.status(500).json({
      success: false,
      message: prodMessage(`Ingestion pipeline failed: ${error.message}`)
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

// Helpers for semantic duplication check using Jaccard Similarity on tokenized words
function getTokens(text) {
  if (!text || typeof text !== 'string') return new Set();
  return new Set(text.toLowerCase().replace(/[^\w\s]/g, '').split(/\s+/).filter(Boolean));
}

function computeJaccard(setA, setB) {
  if (setA.size === 0 || setB.size === 0) return 0;
  const intersection = new Set([...setA].filter(x => setB.has(x)));
  const union = new Set([...setA, ...setB]);
  return intersection.size / union.size;
}

// 4. AI Quiz Generation Endpoint (Semantic Search + Gemini MCQ Creator)
app.post('/api/generate-quiz', writeLimiter, requireAuth, async (req, res) => {
  let { topic, materialId, count = 5, difficulty = 'medium' } = req.body;

  // Make topic focus optional
  topic = typeof topic === 'string' ? topic.slice(0, 200) : '';
  if (!topic) {
    topic = '';
  }

  // Clamp count to bound LLM cost per request (frontend allows up to 100 via repeats)
  count = clampQuestionCount(count);
  difficulty = normalizeDifficulty(difficulty);
  if (materialId !== undefined && materialId !== null) materialId = Number(materialId);

  let contextText = '';

  console.log(`Received quiz generation request (Topic: "${topic || 'Auto-detect'}", Difficulty: ${difficulty}, Count: ${count})`);

  try {
    // If materialId is not provided, fallback to the latest uploaded study material ID
    if (!materialId) {
      console.log('⚠️ materialId was not supplied. Querying the latest uploaded material ID...');
      const pool = initDbPool();
      const latestRes = await pool.query('SELECT id FROM study_materials ORDER BY created_at DESC LIMIT 1');
      if (latestRes.rows.length > 0) {
        materialId = latestRes.rows[0].id;
        console.log(`✅ Using latest material ID: ${materialId}`);
      }
    }

    let chunks = [];
    if (topic && topic.trim() !== '') {
      // A. Generate embedding for query topic
      const queryEmbedding = await generateEmbedding(topic);

      // B. Query vector store for matching textbook segments
      const chunkLimit = Math.max(12, Math.ceil(Number(count) * 0.8));
      console.log(`🔍 Querying vector store for up to ${chunkLimit} relevant chunks (based on requested count: ${count})...`);
      chunks = await searchSimilarChunks(queryEmbedding, chunkLimit, materialId);
    } else {
      // B. Retrieve sequential chunks for the material ID directly
      console.log(`🔍 Querying all sequential chunks for materialId: ${materialId}...`);
      const pool = initDbPool();
      const result = await pool.query(
        `SELECT c.id, c.content, c.page_number, c.chunk_index, m.filename 
         FROM document_chunks c 
         JOIN study_materials m ON c.material_id = m.id 
         WHERE c.material_id = $1 
         ORDER BY c.chunk_index ASC LIMIT 50`,
        [Number(materialId)]
      );
      chunks = result.rows;
    }

    if (chunks && chunks.length > 0) {
      console.log(`✅ Found ${chunks.length} segments to use as context.`);
      contextText = chunks
        .map(c => {
          const fn = c.filename || c.FILENAME || 'study_material';
          const pg = c.pageNumber || c.PAGE_NUMBER || 'unknown';
          const txt = c.content || c.CONTENT || '';
          return `[From textbook: ${fn}, page ${pg}]:\n${txt}`;
        })
        .join('\n\n---\n\n');
    } else {
      console.warn(`❌ No segments found in database.`);
      return res.status(400).json({
        success: false,
        message: 'No study material segments found in your database. Please upload a file first.'
      });
    }
  } catch (error) {
    console.error('❌ Context retrieval failed.');
    return res.status(500).json({
      success: false,
      message: prodMessage(`Failed to retrieve study material context: ${error.message}`)
    });
  }

  // C. Run a loop to accumulate up to `count` questions, avoiding repeats
  const validQuestions = [];
  const questionTexts = [];
  let attempts = 0;
  const targetCount = Number(count);
  let detectedTopic = topic || '';

  try {
    const model = genAI.getGenerativeModel({
      model: 'gemini-3.8-flash',
      generationConfig: {
        responseMimeType: 'application/json'
      }
    });

    while (validQuestions.length < targetCount && attempts < 3) {
      attempts++;
      const needed = targetCount - validQuestions.length;
      console.log(`🤖 MCQ generation loop: attempt ${attempts}/3, currently have ${validQuestions.length}/${targetCount} questions, need ${needed} more.`);

      const avoidPromptText = questionTexts.length > 0
        ? `You MUST avoid generating questions similar or duplicate to these already generated questions:\n${questionTexts.map((qText, idx) => `${idx + 1}. ${qText}`).join('\n')}`
        : '';

      const prompt = `
        You are an expert educator. Your task is to generate a multiple-choice quiz based on the textbook segments provided below.
        
        Topic to focus on: "${topic || 'Auto-detect'}"
        Difficulty level: "${difficulty}"
        Number of questions required in this batch: ${needed}
        
        ${avoidPromptText}
        
        CONTEXT SEGMENTS FROM TEXTBOOK:
        ===
        ${contextText}
        ===
        
        INSTRUCTIONS:
        1. Analyze the context segments. You MUST generate exactly ${needed} unique, high-quality, non-overlapping questions. If the text is short or limited, expand your questions by covering different aspects, details, scenarios, applications, variations, or implications of the concepts mentioned in the text. Always set "insufficient" to false. Do not set it to true under any circumstances.
        
        2. Ensure every question:
           - is directly and factually grounded in the provided context segments.
           - has a "question" string, "options" array of exactly 4 strings, "correctAnswer" index (0, 1, 2, or 3), "explanation" string, and a "sourceReference" string referencing the specific concept or sentence from the context.
           - aligns with the "${difficulty}" difficulty level.
           - has no duplicate options and no ambiguous answers.
        
        3. Return ONLY a valid JSON object matching this schema (do not include any markdown, backticks, or extra text). You must list all ${needed} generated questions inside the "questions" array, and auto-detect a suitable specific topic title for the "detectedTopic" field:
        {
          "insufficient": false,
          "maxPossibleQuestions": ${needed},
          "detectedTopic": "Auto-detected specific quiz topic name",
          "reason": "Successfully generated the requested questions.",
          "questions": [
            {
              "question": "question text",
              "options": ["option 0", "option 1", "option 2", "option 3"],
              "correctAnswer": 0,
              "explanation": "detailed explanation of correct answer",
              "difficulty": "${difficulty}",
              "topic": "${topic || 'Auto-detected topic'}",
              "sourceReference": "exact reference quote or concept"
            }
          ]
        }
      `;

      let responseText;
      if (process.env.GROQ_API_KEY) {
        try {
          console.log(`🤖 Attempting to generate ${needed} questions via Groq API...`);
          responseText = await generateGroqContent(prompt, 'application/json');
        } catch (groqError) {
          console.warn('⚠️ Groq quiz generation failed, falling back to Gemini API:', groqError.message);
          console.log(`🛰️ Attempting to generate ${needed} questions via Gemini API...`);
          const result = await model.generateContent(prompt);
          responseText = result.response.text();
        }
      } else if (process.env.OPENAI_API_KEY) {
        console.log(`🤖 Attempting to generate ${needed} questions via OpenAI API (gpt-4o-mini)...`);
        responseText = await generateOpenAIContent(prompt, 'application/json');
      } else {
        console.log(`🛰️ Attempting to generate ${needed} questions via Gemini API...`);
        const result = await model.generateContent(prompt);
        responseText = result.response.text();
      }

      // Parse JSON payload
      let payload;
      try {
        const cleanJsonText = responseText.replace(/```json|```/g, '').trim();
        payload = JSON.parse(cleanJsonText);
      } catch (e) {
        console.warn('⚠️ Standard JSON parse failed, attempting regex object extraction:', e.message);
        const objectMatch = responseText.match(/\{\s*"insufficient"[\s\S]*\}/);
        if (objectMatch) {
          payload = JSON.parse(objectMatch[0]);
        } else {
          console.error('Failed to extract valid JSON payload from response:\n' + responseText);
          continue;
        }
      }

      if (payload.detectedTopic && !detectedTopic) {
        detectedTopic = payload.detectedTopic;
      }

      const generatedRaw = payload.questions || [];
      console.log(`📥 API response yielded ${generatedRaw.length} raw questions.`);

      // Validate & append questions
      for (const q of generatedRaw) {
        if (!q.question || typeof q.question !== 'string' || q.question.trim() === '') continue;
        if (!Array.isArray(q.options) || q.options.length !== 4) continue;
        if (typeof q.correctAnswer !== 'number' || q.correctAnswer < 0 || q.correctAnswer > 3) continue;
        if (!q.explanation || typeof q.explanation !== 'string') continue;

        const uniqueOptions = new Set(q.options.map(o => String(o).trim().toLowerCase()));
        if (uniqueOptions.size !== 4) continue;

        let isDuplicate = false;
        const tokensQ = getTokens(q.question);
        for (const acceptedText of questionTexts) {
          const tokensAccepted = getTokens(acceptedText);
          const similarity = computeJaccard(tokensQ, tokensAccepted);
          if (similarity > 0.6) {
            isDuplicate = true;
            break;
          }
        }
        if (isDuplicate) continue;

        q.question = q.question.trim();
        q.options = q.options.map(o => String(o).trim());
        q.explanation = q.explanation.trim();
        q.topic = q.topic || topic;
        q.difficulty = q.difficulty || difficulty;
        q.sourceReference = q.sourceReference || 'User study material';

        validQuestions.push(q);
        questionTexts.push(q.question);
      }
    }

    if (validQuestions.length === 0) {
      console.warn(`❌ Ingestion failed: No valid questions could be generated.`);
      return res.status(400).json({
        success: false,
        errorType: 'INSUFFICIENT_CONTENT',
        message: `Your content is not sufficient to generate any valid questions. Please provide more detailed textbook context.`
      });
    }

    // Slice to exactly requested count
    const finalQuestions = validQuestions.slice(0, targetCount);

    console.log(`🎉 Successfully generated ${finalQuestions.length} grounded questions.`);
    res.json({
      success: true,
      fallback: false,
      questions: finalQuestions,
      metadata: {
        sourceType: materialId ? 'uploaded_material' : 'text_input',
        detectedTopic: detectedTopic || topic || 'Study Quiz',
        topicMatch: true,
        grounded: true
      }
    });

  } catch (error) {
    console.error('❌ Quiz generation error:', error.message);
    
    // If the error is a quota/rate limit error, return a clear error
    if (error.message.includes('429') || error.message.includes('quota') || error.message.toLowerCase().includes('quota exceeded') || error.message.includes('QuotaFailure')) {
      return res.status(429).json({
        success: false,
        message: 'Your Google Gemini API Key has exceeded its quota or has been restricted (Rate Limit: 0). Please generate a new API Key in a new project on Google AI Studio or add billing to your current project.'
      });
    }

    // If it is a TLS/DNS connection network socket reset error, return a clear error
    if (error.message.includes('fetch failed') || error.message.includes('network socket') || error.message.includes('ECONNRESET')) {
      return res.status(503).json({
        success: false,
        message: 'A local network connection error occurred while connecting to the Google Gemini API. Please check your internet connection or disable any active VPN/proxies.'
      });
    }
    
    // Return the actual failure error to prevent silently falling back to mock questions
    res.status(500).json({
      success: false,
      message: prodMessage(`Failed to generate quiz: ${error.message}`)
    });
  }
});

// Helper to generate a copy-pasteable Google Apps Script to create the Google Form Quiz
function generateAppsScript(quizTitle, questions) {
  let code = `function createGoogleFormQuiz() {\n`;
  code += `  var form = FormApp.create(${JSON.stringify(quizTitle)});\n`;
  code += `  form.setIsQuiz(true);\n\n`;
  
  questions.forEach((q, idx) => {
    code += `  // Question ${idx + 1}\n`;
    code += `  var item = form.addMultipleChoiceItem();\n`;
    code += `  item.setTitle(${JSON.stringify(q.question)});\n`;
    
    // Build choices
    const choicesList = q.options.map((opt, oIdx) => {
      const isCorrect = oIdx === q.correctAnswer;
      return `item.createChoice(${JSON.stringify(opt)}, ${isCorrect})`;
    }).join(',\n      ');
    
    code += `  item.setChoices([\n      ${choicesList}\n  ]);\n`;
    code += `  item.setPoints(1);\n`;
    
    if (q.explanation) {
      code += `  var feedback = FormApp.createFeedback().setText(${JSON.stringify(q.explanation)}).build();\n`;
      code += `  item.setFeedbackForCorrect(feedback);\n`;
      code += `  item.setFeedbackForIncorrect(feedback);\n`;
    }
    code += `\n`;
  });
  
  code += `  Logger.log("Form created successfully! ID: " + form.getId());\n`;
  code += `  Logger.log("Responder URL: " + form.getPublishedUrl());\n`;
  code += `}\n`;
  return code;
}

// 5. Google Forms Export Endpoint (Creates a graded Quiz in Google Forms)
app.post('/api/export-quiz', writeLimiter, requireAuth, async (req, res) => {
  const title = typeof req.body.title === 'string' ? req.body.title.slice(0, 200) : req.body.title;
  const questions = Array.isArray(req.body.questions) ? req.body.questions.slice(0, 100) : req.body.questions;

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
    const appsScriptCode = generateAppsScript(title, questions);
    res.json({
      success: false,
      appsScriptFallback: true,
      appsScriptCode,
      message: 'Failed to export to Google Forms automatically. Use the One-Click Google Apps Script code below to generate it instantly without any Cloud setup!',
      error: error.message
    });
  }
});

// 6. Socket.io Real-Time Quiz Rooms Connection Handlers (Lobby Phase)
io.on('connection', (socket) => {
  console.log(`🔌 Client connected to WebSocket: ${socket.id}`);

  // A. Host Creates a Room (host must be authenticated when auth is enforced;
  // players joining via code stay public so classrooms can join without accounts)
  socket.on('create-room', async ({ roomCode, quizTitle, questions, difficulty, timePerQuestion }) => {
    if (isAuthEnforced()) {
      const token = socket.handshake?.auth?.token;
      const user = await verifySocketToken(token);
      if (!user) {
        socket.emit('join-error', { message: 'Host authentication required. Please log in again.' });
        console.warn(`🚫 Rejected unauthenticated create-room from socket ${socket.id}`);
        return;
      }
      socket.data.user = user;
    }
    const currentCount = await getRoomCount();
    if (currentCount >= MAX_ROOMS) {
      socket.emit('join-error', { message: 'Server is at room capacity. Please try again later.' });
      return;
    }
    const actualRoomCode = sanitizeRoomCode(roomCode) ||
      Math.random().toString(36).substring(2, 8).toUpperCase();
    const safeQuestions = sanitizeQuestionsForRoom(questions);
    const safeDifficulty = ALLOWED_DIFFICULTIES.has(difficulty) ? difficulty : 'medium';
    
    // Check if the room already exists (host reconnect/refresh case)
    if (await hasRoom(actualRoomCode)) {
      const existingRoom = await getRoom(actualRoomCode);
      if (existingRoom) {
        if (existingRoom.deleteTimeout) {
          clearTimeout(existingRoom.deleteTimeout);
          existingRoom.deleteTimeout = null;
        }
        existingRoom.hostId = socket.id; // update host socket id
        await setRoom(actualRoomCode, existingRoom);
        socket.join(actualRoomCode);
        socket.emit('room-created', { roomCode: actualRoomCode, quizTitle: existingRoom.quizTitle });
        console.log(`🔄 Host reconnected to existing room ${actualRoomCode}. Cleared delete timeout.`);
        return;
      }
    }

    const newRoom = {
      hostId: socket.id,
      quizTitle: String(quizTitle || 'AI Generated Multiplayer Quiz').slice(0, 120),
      questions: safeQuestions,
      players: [],
      status: 'LOBBY',
      currentQuestionIndex: 0,
      difficulty: safeDifficulty,
      timePerQuestion: clampTimePerQuestion(timePerQuestion)
    };
    await setRoom(actualRoomCode, newRoom);

    socket.join(actualRoomCode);
    socket.emit('room-created', { roomCode: actualRoomCode, quizTitle });
    console.log(`🏠 Room ${actualRoomCode} created by host socket: ${socket.id} (Difficulty: ${difficulty}, Time: ${timePerQuestion}s)`);
  });

  // B. Player Joins a Room (Handles new joins, late joins, and reconnects)
  socket.on('join-room', async ({ roomCode, playerName, avatar }) => {
    const safeRoomCode = sanitizeRoomCode(roomCode);
    const room = await getRoom(safeRoomCode);

    if (!room) {
      return socket.emit('join-error', { message: 'Room not found. Please verify the code.' });
    }

    if (room.status === 'FINISHED') {
      return socket.emit('join-error', { message: 'This quiz has already finished.' });
    }

    if (!sanitizePlayerName(playerName)) {
      return socket.emit('join-error', { message: 'Please enter your name.' });
    }

    if (room.players.length >= MAX_PLAYERS_PER_ROOM) {
      return socket.emit('join-error', { message: 'Room is full. Please try another quiz.' });
    }

    const safeName = sanitizePlayerName(playerName);
    const safeAvatar = sanitizeAvatar(avatar);

    // Check if player is rejoining (reconnecting after a network error)
    let player = room.players.find(p => p.name === safeName);
    if (player) {
      // Update socket ID and avatar to the new connection
      player.id = socket.id;
      player.avatar = safeAvatar;
      player.online = true;
      console.log(`👤 Player "${safeName}" reconnected. Updated socket ID.`);
    } else {
      // New player joining
      player = {
        id: socket.id,
        name: safeName,
        avatar: safeAvatar,
        score: 0,
        online: true
      };
      room.players.push(player);
      console.log(`👤 Player "${safeName}" (${socket.id}) joined room: ${safeRoomCode} with avatar: ${safeAvatar}`);
    }

    await setRoom(safeRoomCode, room);
    socket.join(safeRoomCode);

    // Notify player of successful join
    socket.emit('join-success', {
      roomCode: safeRoomCode,
      quizTitle: room.quizTitle,
      players: room.players,
      status: room.status,
      currentQuestionIndex: room.currentQuestionIndex || 0,
      difficulty: room.difficulty,
      timePerQuestion: room.timePerQuestion
    });

    // Broadcast updated player list to everyone in the room (so leaderboard updates)
    io.to(safeRoomCode).emit('player-joined', { players: room.players });
  });

  // C. Start Quiz (Triggered by Host)
  socket.on('start-quiz', async ({ roomCode }) => {
    const safe = sanitizeRoomCode(roomCode);
    const room = await getRoom(safe);
    if (room && room.hostId === socket.id) {
      room.status = 'PLAYING';
      await setRoom(safe, room);
      io.to(safe).emit('quiz-started', {
        questions: room.questions,
        questionsCount: room.questions.length,
        difficulty: room.difficulty,
        timePerQuestion: room.timePerQuestion
      });
      console.log(`🎮 Quiz started in room ${safe} by host.`);
    }
  });

  // D. Submit Answer (Triggered by Player) — server is authoritative for correctness.
  // Client sends selectedOption; server compares against room questions. Client isCorrect is ignored.
  socket.on('submit-answer', async ({ roomCode, questionIndex, timeTaken, selectedOption }) => {
    const safeRoomCode = sanitizeRoomCode(roomCode);
    const room = await getRoom(safeRoomCode);
    if (room) {
      const player = room.players.find(p => p.id === socket.id);
      if (player) {
        if (player.totalTimeTaken === undefined) player.totalTimeTaken = 0;
        if (player.correctAnswersCount === undefined) player.correctAnswersCount = 0;

        const qIdx = Number(questionIndex);
        const sel = Number(selectedOption);
        const question = Number.isInteger(qIdx) ? room.questions[qIdx] : undefined;
        const isCorrect =
          question &&
          Number.isInteger(sel) && sel >= 0 && sel <= 3 &&
          sel === question.correctAnswer;

        const secsTaken = Math.min(86400, Math.max(0, Number(timeTaken) || 0));
        player.totalTimeTaken += secsTaken;
        player.selectedOption = Number.isInteger(sel) && sel >= 0 && sel <= 3 ? sel : undefined;

        if (isCorrect) {
          player.score += 10; // Simple, clean 10 points per correct answer
          player.correctAnswersCount += 1;
        }

        await setRoom(safeRoomCode, room);

        // Broadcast updated scores to everyone in the room (displays on real-time Leaderboard)
        io.to(safeRoomCode).emit('scores-updated', { players: room.players });

        console.log(`📝 Player "${player.name}" submitted answer for Q${Number.isInteger(qIdx) ? qIdx : '?'} (Correct: ${!!isCorrect}, Time: ${secsTaken}s). Score: ${player.score}, Total Time: ${player.totalTimeTaken}s`);
      }
    }
  });

  // E. Next Question (Triggered by Host)
  socket.on('next-question', async ({ roomCode, nextIndex }) => {
    const safe = sanitizeRoomCode(roomCode);
    const room = await getRoom(safe);
    if (room && room.hostId === socket.id) {
      const safeNext = Math.min(
        Math.max(0, Math.floor(Number(nextIndex) || 0)),
        Math.max(0, room.questions.length - 1)
      );
      room.currentQuestionIndex = safeNext; // Track current index in room state for late joiners

      // Reset selectedOption for all players for the new question
      room.players.forEach(p => {
        p.selectedOption = undefined;
      });

      await setRoom(safe, room);

      io.to(safe).emit('show-question', { questionIndex: safeNext });
      console.log(`➡️ Host progressed room ${safe} to question index ${safeNext}`);
    }
  });

  // E2. Reveal Results Early (Triggered by Host)
  socket.on('reveal-results', async ({ roomCode }) => {
    const safe = sanitizeRoomCode(roomCode);
    const room = await getRoom(safe);
    if (room && room.hostId === socket.id) {
      io.to(safe).emit('results-revealed');
      console.log(`👁️ Host revealed results early in room ${safe}`);
    }
  });

  // E3. Reveal Mid-Quiz Leaderboard (Triggered by Host)
  socket.on('reveal-mid-leaderboard', async ({ roomCode }) => {
    const safe = sanitizeRoomCode(roomCode);
    const room = await getRoom(safe);
    if (room && room.hostId === socket.id) {
      io.to(safe).emit('mid-leaderboard-revealed');
      console.log(`📊 Host revealed mid-quiz leaderboard in room ${safe}`);
    }
  });

  // F. End Quiz (Triggered by Host)
  socket.on('end-quiz', async ({ roomCode }) => {
    const safe = sanitizeRoomCode(roomCode);
    const room = await getRoom(safe);
    if (room && room.hostId === socket.id) {
      room.status = 'FINISHED';
      await setRoom(safe, room);

      // Sort: 1. Higher score/correct answers. 2. Less time taken (totalTimeTaken).
      const sortedLeaderboard = [...room.players].sort((a, b) => {
        if (b.score !== a.score) {
          return b.score - a.score;
        }
        return (a.totalTimeTaken || 0) - (b.totalTimeTaken || 0);
      });

      io.to(safe).emit('quiz-finished', {
        leaderboard: sortedLeaderboard
      });
      console.log(`🏁 Quiz ended in room ${safe} by host.`);
    }
  });

  // G. Disconnect Handler
  socket.on('disconnect', async () => {
    console.log(`🔌 Client disconnected from WebSocket: ${socket.id}`);

    // Check if the disconnected client belongs to any room
    const allRooms = await getAllRooms();
    for (const [roomCode, room] of allRooms) {
      // If Host disconnects -> close the room completely after a grace period to support reconnections
      if (room.hostId === socket.id) {
        console.log(`⚠️ Host disconnected from room ${roomCode}. Starting 20-second room delete grace period...`);
        io.to(roomCode).emit('host-disconnected', { message: 'Host disconnected. Waiting for reconnection...' });
        
        room.deleteTimeout = setTimeout(async () => {
          io.to(roomCode).emit('room-closed', { message: 'Host connection lost. Room closed.' });
          await deleteRoom(roomCode);
          console.log(`🗑️ Room ${roomCode} deleted after 20-second host reconnect grace period expired.`);
        }, 20000); 
        await setRoom(roomCode, room);
        break;
      }

      // If Player disconnects -> mark as offline and notify other clients
      const player = room.players?.find(p => p.id === socket.id);
      if (player) {
        player.online = false;
        await setRoom(roomCode, room);
        io.to(roomCode).emit('player-left', { players: room.players });
        console.log(`👤 Player "${player.name}" went offline in room ${roomCode} (disconnected).`);
        break;
      }
    }
  });
});

// Contact Form Mail Route (rate-limited, validated)
app.post('/api/contact', contactLimiter, async (req, res) => {
  const email = typeof req.body.email === 'string' ? req.body.email.trim().slice(0, 254) : '';
  const message = typeof req.body.message === 'string' ? req.body.message.trim().slice(0, 2000) : '';

  const emailOk = isValidEmail(email);
  if (!emailOk || !message) {
    return res.status(400).json({ success: false, message: 'Valid email and message are required.' });
  }

  try {
    if (!process.env.SMTP_USER || !process.env.SMTP_PASS || !process.env.SMTP_TO) {
      console.warn('⚠️ SMTP not configured. Message rejected to avoid silent success.');
      return res.status(503).json({
        success: false,
        message: 'Contact service is not configured. Please try again later.'
      });
    }

    const safeEmail = email.replace(/[\r\n]/g, '');
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });

    const mailOptions = {
      from: process.env.SMTP_USER,
      to: process.env.SMTP_TO,
      subject: `QuizMaster Contact Message from ${safeEmail}`.slice(0, 200),
      text: `You received a new contact message:\n\nSender Email: ${safeEmail}\n\nMessage:\n${message}`,
      replyTo: safeEmail
    };

    await transporter.sendMail(mailOptions);
    console.log('✉️ Contact message sent via SMTP.');
    return res.json({ success: true, message: 'Message sent successfully!' });
  } catch (error) {
    console.error('Error sending contact message email.');
    res.status(500).json({ success: false, message: prodMessage(`Failed to send message: ${error.message}`) });
  }
});

// Start Server
registerSchemaInitializer(initializeSchema);

httpServer.listen(PORT, async () => {
  logger.info({ port: PORT }, `🚀 QuizMaster server (with Socket.io) listening on port ${PORT}`);
  logger.info(`🔗 Status endpoint: http://localhost:${PORT}/api/status`);
  logger.info(`🔗 Database test endpoint: http://localhost:${PORT}/api/db-check`);
  
  // Initialize PostgreSQL DB Connection Pool & Schema on boot
  try {
    const pool = await initDbPool();
    if (pool) {
      logger.info('📦 Database pool ready, running schema setup...');
      await initializeSchema();
    }
  } catch (error) {
    logger.warn('⚠️ Could not initialize PostgreSQL DB Pool on startup. Connection will automatically retry when a request is made.');
  }
});

// Global Error Handler Middleware (Production-grade safety)
app.use((err, req, res, next) => {
  logger.error({ err }, '💥 Uncaught System Error');
  res.status(500).json({
    success: false,
    message: 'An unexpected system error occurred.',
    error: process.env.NODE_ENV === 'production' ? {} : err.message
  });
});

// Process-level handlers for uncaught issues to prevent process crashes
process.on('unhandledRejection', (reason, promise) => {
  logger.error({ reason }, '💥 Unhandled Promise Rejection');
});

process.on('uncaughtException', (error) => {
  logger.error({ error }, '💥 Uncaught Exception');
});

// Graceful shutdown
const gracefulShutdown = async () => {
  logger.info('Stopping server gracefully...');
  await closeDbPool();
  process.exit(0);
};

process.on('SIGINT', gracefulShutdown);
process.on('SIGTERM', gracefulShutdown);
