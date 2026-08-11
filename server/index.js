import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { initDbPool, closeDbPool } from './db/db.js';
import { extractTextFromFile } from './utils/parser.js';
import { splitText } from './utils/textSplitter.js';
import { generateEmbedding } from './utils/gemini.js';
import { saveMaterial, saveChunk, searchSimilarChunks, initializeSchema } from './db/vectorStore.js';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { generateGroqContent } from './utils/groq.js';
import { generateOpenAIContent } from './utils/openai.js';
import { hasGoogleCredentials, createGoogleForm } from './utils/googleForms.js';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Wrap Express app inside HTTP server to support WebSockets (Socket.io)
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

// In-memory state for tracking active multiplayer quiz rooms
const rooms = new Map();

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

// Configure CORS to allow connections from Vercel production frontend and local dev
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
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
    res.status(500).json({
      success: false,
      message: 'Failed to connect to PostgreSQL Database.',
      error: error.message
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
    // A quick local length check to avoid calling APIs on completely empty/useless input
    if (!rawText || rawText.trim().length < 5) {
      return res.status(400).json({
        success: false,
        errorType: 'INSUFFICIENT_CONTENT',
        message: 'Please provide some study material first.'
      });
    }

    const topic = req.body.topic;
    if (topic && topic.trim().length >= 2) {
      console.log(`🔍 Running semantic validation for topic focus: "${topic}"`);
      const model = genAI.getGenerativeModel({
        model: 'gemini-2.0-flash',
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
           - "RELATED": The text topic is a subtopic, parent topic, or closely related academic area (e.g., selected topic is "Database", text is about "SQL Normalization"; or selected topic is "Machine Learning", text is about "Neural Networks"; or selected topic is "Computer Science", text is about "Operating Systems").
           - "MISMATCH": The text is completely unrelated to the selected topic (e.g. selected topic is "Database", text is about "Photosynthesis" or "Plant Biology").
        
        Return ONLY a valid JSON object matching this schema:
        {
          "sufficiency": "EMPTY" | "INSUFFICIENT" | "SUFFICIENT" | "RICH",
          "sufficiencyReason": "explanation of sufficiency classification",
          "detectedTopic": "detected topic string",
          "matchType": "EXACT" | "RELATED" | "MISMATCH",
          "relationExplanation": "explanation of why it is classified as exact, related, or mismatch"
        }
        
        Text to analyze (first 4000 chars):
        """
        ${rawText.substring(0, 4000)}
        """
      `;

      try {
        let responseText;
        if (process.env.GROQ_API_KEY) {
          console.log('🤖 Running validation via Groq API (Llama 3.3)...');
          responseText = await generateGroqContent(checkPrompt, 'application/json');
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

        if (checkData.matchType === 'MISMATCH') {
          console.warn(`❌ Ingestion rejected: Topic mismatch. Selected: "${topic}", Detected: "${checkData.detectedTopic}"`);
          return res.status(400).json({
            success: false,
            errorType: 'TOPIC_MISMATCH',
            message: `⚠️ Topic mismatch detected.\n\nYou selected: "${topic}"\nBut your uploaded content appears to be about: "${checkData.detectedTopic}".\n\nPlease either:\n• change the topic to "${checkData.detectedTopic}"\nOR\n• upload content related to "${topic}".`,
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
        const isGreeting = /\b(hey|hello|hi|hii|helloo|testing)\b/.test(textLower);
        if (isGreeting || rawText.trim().length < 25) {
          return res.status(400).json({
            success: false,
            errorType: 'INSUFFICIENT_CONTENT',
            message: 'Your input is too limited to create meaningful MCQs. Add a few more concepts or upload study material.'
          });
        }
      }
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
app.post('/api/generate-quiz', async (req, res) => {
  let { topic, materialId, count = 5, difficulty = 'medium' } = req.body;

  if (!topic || topic.trim() === '') {
    return res.status(400).json({ success: false, message: 'Topic name is required.' });
  }

  let contextText = '';

  console.log(`🔍 Received quiz generation request for topic: "${topic}" (Difficulty: ${difficulty}, Count: ${count})`);

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

    // A. Generate embedding for query topic
    const queryEmbedding = await generateEmbedding(topic);

    // B. Query vector store for matching textbook segments
    const chunks = await searchSimilarChunks(queryEmbedding, 5, materialId);

    if (chunks && chunks.length > 0) {
      console.log(`✅ Found ${chunks.length} semantically relevant chunks in vector DB.`);
      contextText = chunks
        .map(c => {
          const fn = c.filename || c.FILENAME || 'study_material';
          const pg = c.pageNumber || c.PAGE_NUMBER || 'unknown';
          const txt = c.content || c.CONTENT || '';
          return `[From textbook: ${fn}, page ${pg}]:\n${txt}`;
        })
        .join('\n\n---\n\n');
    } else {
      console.warn(`❌ No relevant chunks found for topic "${topic}".`);
      return res.status(400).json({
        success: false,
        message: `No relevant content found for topic "${topic}" in your uploaded study material. Please make sure your Topic Focus matches the contents of your uploaded document.`
      });
    }
  } catch (error) {
    console.error('❌ Vector store retrieval failed:', error.message);
    return res.status(500).json({
      success: false,
      message: `Failed to retrieve study material context: ${error.message}`
    });
  }

  // C. Build the prompt for Gemini
  try {
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.0-flash',
      generationConfig: {
        responseMimeType: 'application/json'
      }
    });

    const prompt = `
      You are an expert educator. Your task is to generate a multiple-choice quiz based on the textbook segments provided below.
      
      Topic to focus on: "${topic}"
      Difficulty level: "${difficulty}"
      Number of questions required: ${count}
      
      CONTEXT SEGMENTS FROM TEXTBOOK:
      ===
      ${contextText}
      ===
      
      INSTRUCTIONS:
      1. Analyze the context segments. If they do not contain enough substance to generate exactly ${count} unique, high-quality, non-overlapping questions without duplicating concepts or making up facts, you MUST set the "insufficient" flag to true and specify "maxPossibleQuestions" in the JSON response. Do NOT attempt to invent unrelated questions.
      
      2. If you generate the quiz, ensure every question:
         - is directly and factually grounded in the provided context segments.
         - has a "question" string, "options" array of exactly 4 strings, "correctAnswer" index (0, 1, 2, or 3), "explanation" string, and a "sourceReference" string referencing the specific concept or sentence from the context.
         - aligns with the "${difficulty}" difficulty level:
           * "easy": focuses on basic definitions, facts, and direct concept identification.
           * "medium": focuses on conceptual application, simple scenario analysis, or comparison.
           * "hard": focuses on complex scenarios, trap options, multi-step reasoning, or edge cases.
         - has no duplicate options and no ambiguous answers.
      
      3. Return ONLY a valid JSON object matching this schema (do not include any markdown, backticks, or extra text):
      {
        "insufficient": false,
        "maxPossibleQuestions": ${count},
        "reason": "optional explanation string",
        "questions": [
          {
            "question": "question text",
            "options": ["option 0", "option 1", "option 2", "option 3"],
            "correctAnswer": 0,
            "explanation": "detailed explanation of correct answer",
            "difficulty": "${difficulty}",
            "topic": "${topic}",
            "sourceReference": "exact reference quote or concept"
          }
        ]
      }
      
      If the content is insufficient:
      {
        "insufficient": true,
        "maxPossibleQuestions": 2,
        "reason": "Brief explanation of why the content can only support 2 questions"
      }
    `;

    let responseText;
    if (process.env.GROQ_API_KEY) {
      console.log('🤖 Generating quiz questions via Groq API (Llama 3.3)...');
      responseText = await generateGroqContent(prompt, 'application/json');
    } else if (process.env.OPENAI_API_KEY) {
      console.log('🤖 Generating quiz questions via OpenAI API (gpt-4o-mini)...');
      responseText = await generateOpenAIContent(prompt, 'application/json');
    } else {
      console.log('🛰️ Generating quiz questions via Gemini API...');
      const result = await model.generateContent(prompt);
      responseText = result.response.text();
    }
    
    // Parse response with resilient extraction (removes markdown wrapping and extracts raw JSON object)
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
        throw new Error('Failed to extract valid JSON payload from response:\n' + responseText);
      }
    }

    if (payload.insufficient === true) {
      const maxQ = payload.maxPossibleQuestions || 0;
      console.warn(`❌ Ingestion failed: Insufficient unique content for ${count} questions (Max possible: ${maxQ}).`);
      return res.status(400).json({
        success: false,
        errorType: 'INSUFFICIENT_CONTENT',
        message: `Your content contains enough information for approximately ${maxQ} unique questions. Add more material to generate ${count} questions.`
      });
    }

    const generatedRaw = payload.questions || [];
    const validQuestions = [];
    const questionTexts = [];

    // Perform self-validation & duplicate detection
    for (const q of generatedRaw) {
      // 1. Validate property existence & types
      if (!q.question || typeof q.question !== 'string' || q.question.trim() === '') continue;
      if (!Array.isArray(q.options) || q.options.length !== 4) continue;
      if (typeof q.correctAnswer !== 'number' || q.correctAnswer < 0 || q.correctAnswer > 3) continue;
      if (!q.explanation || typeof q.explanation !== 'string') continue;

      // 2. Options uniqueness check
      const uniqueOptions = new Set(q.options.map(o => String(o).trim().toLowerCase()));
      if (uniqueOptions.size !== 4) continue;

      // 3. Near-duplicate check with already accepted questions
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

      // Clean properties and accept
      q.question = q.question.trim();
      q.options = q.options.map(o => String(o).trim());
      q.explanation = q.explanation.trim();
      q.topic = q.topic || topic;
      q.difficulty = q.difficulty || difficulty;
      q.sourceReference = q.sourceReference || 'User study material';

      validQuestions.push(q);
      questionTexts.push(q.question);
    }

    console.log(`[Validation] Validated ${validQuestions.length} of ${generatedRaw.length} questions.`);

    if (validQuestions.length < count) {
      console.warn(`❌ Ingestion failed: Only ${validQuestions.length} valid questions could be generated (Requested: ${count}).`);
      return res.status(400).json({
        success: false,
        errorType: 'INSUFFICIENT_CONTENT',
        message: `Your content contains enough information for approximately ${validQuestions.length} unique questions. Add more material to generate ${count} questions.`
      });
    }

    // Slice to exactly requested count
    const finalQuestions = validQuestions.slice(0, count);

    console.log(`🎉 Successfully generated ${finalQuestions.length} grounded questions.`);
    res.json({
      success: true,
      fallback: false,
      questions: finalQuestions,
      metadata: {
        sourceType: materialId ? 'uploaded_material' : 'text_input',
        detectedTopic: topic,
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
      message: `Failed to generate quiz: ${error.message}`
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

// 6. Socket.io Real-Time Quiz Rooms Connection Handlers (Lobby Phase)
io.on('connection', (socket) => {
  console.log(`🔌 Client connected to WebSocket: ${socket.id}`);

  // A. Host Creates a Room
  socket.on('create-room', ({ roomCode, quizTitle, questions, difficulty, timePerQuestion }) => {
    const actualRoomCode = (roomCode || Math.random().toString(36).substring(2, 8).toUpperCase()).toUpperCase();
    
    // Check if the room already exists (host reconnect/refresh case)
    if (rooms.has(actualRoomCode)) {
      const existingRoom = rooms.get(actualRoomCode);
      if (existingRoom.deleteTimeout) {
        clearTimeout(existingRoom.deleteTimeout);
        existingRoom.deleteTimeout = null;
      }
      existingRoom.hostId = socket.id; // update host socket id
      socket.join(actualRoomCode);
      socket.emit('room-created', { roomCode: actualRoomCode, quizTitle: existingRoom.quizTitle });
      console.log(`🔄 Host reconnected to existing room ${actualRoomCode}. Cleared delete timeout.`);
      return;
    }

    rooms.set(actualRoomCode, {
      hostId: socket.id,
      quizTitle,
      questions: questions || [],
      players: [],
      status: 'LOBBY',
      currentQuestionIndex: 0,
      difficulty: difficulty || 'medium',
      timePerQuestion: timePerQuestion || 60
    });

    socket.join(actualRoomCode);
    socket.emit('room-created', { roomCode: actualRoomCode, quizTitle });
    console.log(`🏠 Room ${actualRoomCode} created by host socket: ${socket.id} (Difficulty: ${difficulty}, Time: ${timePerQuestion}s)`);
  });

  // B. Player Joins a Room (Handles new joins, late joins, and reconnects)
  socket.on('join-room', ({ roomCode, playerName, avatar }) => {
    const room = rooms.get(roomCode);

    if (!room) {
      return socket.emit('join-error', { message: 'Room not found. Please verify the code.' });
    }

    if (room.status === 'FINISHED') {
      return socket.emit('join-error', { message: 'This quiz has already finished.' });
    }

    // Check if player is rejoining (reconnecting after a network error)
    let player = room.players.find(p => p.name === playerName);
    if (player) {
      // Update socket ID and avatar to the new connection
      player.id = socket.id;
      player.avatar = avatar || player.avatar || '🧑';
      player.online = true;
      console.log(`👤 Player "${playerName}" reconnected. Updated socket ID.`);
    } else {
      // New player joining
      player = {
        id: socket.id,
        name: playerName,
        avatar: avatar || '🧑', // Save the player's chosen emoji avatar
        score: 0,
        online: true
      };
      room.players.push(player);
      console.log(`👤 Player "${playerName}" (${socket.id}) joined room: ${roomCode} with avatar: ${avatar}`);
    }

    socket.join(roomCode);
    
    // Notify player of successful join
    socket.emit('join-success', {
      roomCode,
      quizTitle: room.quizTitle,
      players: room.players,
      status: room.status,
      currentQuestionIndex: room.currentQuestionIndex || 0,
      difficulty: room.difficulty,
      timePerQuestion: room.timePerQuestion
    });

    // Broadcast updated player list to everyone in the room (so leaderboard updates)
    io.to(roomCode).emit('player-joined', { players: room.players });
  });

  // C. Start Quiz (Triggered by Host)
  socket.on('start-quiz', ({ roomCode }) => {
    const room = rooms.get(roomCode);
    if (room && room.hostId === socket.id) {
      room.status = 'PLAYING';
      io.to(roomCode).emit('quiz-started', {
        questionsCount: room.questions.length,
        difficulty: room.difficulty,
        timePerQuestion: room.timePerQuestion
      });
      console.log(`🎮 Quiz started in room ${roomCode} by host.`);
    }
  });

  // D. Submit Answer (Triggered by Player)
  socket.on('submit-answer', ({ roomCode, questionIndex, isCorrect, timeTaken }) => {
    const room = rooms.get(roomCode);
    if (room) {
      const player = room.players.find(p => p.id === socket.id);
      if (player) {
        if (player.totalTimeTaken === undefined) player.totalTimeTaken = 0;
        if (player.correctAnswersCount === undefined) player.correctAnswersCount = 0;

        const secsTaken = Number(timeTaken) || 0;
        player.totalTimeTaken += secsTaken;

        if (isCorrect) {
          player.score += 10; // Simple, clean 10 points per correct answer
          player.correctAnswersCount += 1;
        }

        // Broadcast updated scores to everyone in the room (displays on real-time Leaderboard)
        io.to(roomCode).emit('scores-updated', { players: room.players });
        console.log(`📝 Player "${player.name}" submitted answer for Q${questionIndex} (Correct: ${isCorrect}, Time: ${secsTaken}s). Score: ${player.score}, Total Time: ${player.totalTimeTaken}s`);
      }
    }
  });

  // E. Next Question (Triggered by Host)
  socket.on('next-question', ({ roomCode, nextIndex }) => {
    const room = rooms.get(roomCode);
    if (room && room.hostId === socket.id) {
      room.currentQuestionIndex = nextIndex; // Track current index in room state for late joiners
      io.to(roomCode).emit('show-question', { questionIndex: nextIndex });
      console.log(`➡️ Host progressed room ${roomCode} to question index ${nextIndex}`);
    }
  });

  // F. End Quiz (Triggered by Host)
  socket.on('end-quiz', ({ roomCode }) => {
    const room = rooms.get(roomCode);
    if (room && room.hostId === socket.id) {
      room.status = 'FINISHED';

      // Sort: 1. Higher score/correct answers. 2. Less time taken (totalTimeTaken).
      const sortedLeaderboard = [...room.players].sort((a, b) => {
        if (b.score !== a.score) {
          return b.score - a.score;
        }
        return (a.totalTimeTaken || 0) - (b.totalTimeTaken || 0);
      });

      io.to(roomCode).emit('quiz-finished', {
        leaderboard: sortedLeaderboard
      });
      console.log(`🏁 Quiz ended in room ${roomCode} by host.`);
    }
  });

  // G. Disconnect Handler
  socket.on('disconnect', () => {
    console.log(`🔌 Client disconnected from WebSocket: ${socket.id}`);

    // Check if the disconnected client belongs to any room
    for (const [roomCode, room] of rooms.entries()) {
      // If Host disconnects -> close the room completely after a grace period to support reconnections
      if (room.hostId === socket.id) {
        console.log(`⚠️ Host disconnected from room ${roomCode}. Starting 20-second room delete grace period...`);
        io.to(roomCode).emit('host-disconnected', { message: 'Host disconnected. Waiting for reconnection...' });
        
        room.deleteTimeout = setTimeout(() => {
          io.to(roomCode).emit('room-closed', { message: 'Host connection lost. Room closed.' });
          rooms.delete(roomCode);
          console.log(`🗑️ Room ${roomCode} deleted after 20-second host reconnect grace period expired.`);
        }, 20000); 
        break;
      }

      // If Player disconnects -> mark as offline and notify other clients
      const player = room.players.find(p => p.id === socket.id);
      if (player) {
        player.online = false;
        io.to(roomCode).emit('player-left', { players: room.players });
        console.log(`👤 Player "${player.name}" went offline in room ${roomCode} (disconnected).`);
        break;
      }
    }
  });
});

// Contact Form Mail Route
app.post('/api/contact', async (req, res) => {
  const { email, message } = req.body;

  if (!email || !message) {
    return res.status(400).json({ success: false, message: 'Email and message are required.' });
  }

  try {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.SMTP_USER || 'pawartanaya02@gmail.com',
        pass: process.env.SMTP_PASS || ''
      }
    });

    const mailOptions = {
      from: process.env.SMTP_USER || 'pawartanaya02@gmail.com',
      to: 'pawartanaya02@gmail.com',
      subject: `QuizMaster Contact Message from ${email}`,
      text: `You received a new contact message:\n\nSender Email: ${email}\n\nMessage:\n${message}`,
      replyTo: email
    };

    if (process.env.SMTP_PASS) {
      await transporter.sendMail(mailOptions);
      console.log(`✉️ Email successfully sent via SMTP to pawartanaya02@gmail.com from ${email}`);
      return res.json({ success: true, message: 'Message sent successfully!' });
    } else {
      console.warn(`⚠️ SMTP Credentials not configured in server/.env. Message logged to console:`);
      console.log(`✉️ SENDER: ${email}\n✉️ MESSAGE: ${message}`);
      return res.json({ 
        success: true, 
        message: 'Message captured! (Configure SMTP_PASS in your server/.env file to enable actual email delivery)' 
      });
    }
  } catch (error) {
    console.error('Error sending contact message email:', error);
    res.status(500).json({ success: false, message: 'Failed to send message.', error: error.message });
  }
});

// Start Server
httpServer.listen(PORT, async () => {
  console.log(`🚀 QuizMaster server (with Socket.io) listening on port ${PORT}`);
  console.log(`🔗 Status endpoint: http://localhost:${PORT}/api/status`);
  console.log(`🔗 Database test endpoint: http://localhost:${PORT}/api/db-check`);
  
  // Initialize PostgreSQL DB Connection Pool & Schema on boot
  try {
    const pool = await initDbPool();
    if (pool) {
      await initializeSchema();
    }
  } catch (error) {
    console.error('⚠️ Could not initialize PostgreSQL DB Pool on startup. Ensure connection URL is set in .env.');
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
