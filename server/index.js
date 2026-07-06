import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import multer from 'multer';
import oracledb from 'oracledb';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { initDbPool, closeDbPool } from './db/db.js';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

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

// 3. Test File Upload Endpoint
app.post('/api/test-upload', upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, message: 'No file uploaded.' });
  }

  res.json({
    success: true,
    message: 'File uploaded successfully!',
    file: {
      originalName: req.file.originalname,
      filename: req.file.filename,
      size: req.file.size,
      path: req.file.path
    }
  });
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
