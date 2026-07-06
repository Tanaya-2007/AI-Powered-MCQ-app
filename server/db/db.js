import oracledb from 'oracledb';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Enable OracleDB Thin Mode (this is default in v6+, does not require Oracle Instant Client binaries)
oracledb.outFormat = oracledb.OUT_FORMAT_OBJECT;

const poolConfig = {
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  connectString: process.env.DB_CONNECTION_STRING,
  poolMin: 1,
  poolMax: 10,
  poolIncrement: 1,
  poolTimeout: 60 // Close idle connections after 60 seconds
};

let pool;

/**
 * Initializes the Oracle Database Connection Pool.
 */
export async function initDbPool() {
  if (pool) return pool;

  const { user, password, connectString } = poolConfig;
  if (!user || !password || !connectString) {
    console.warn(
      '⚠️ Oracle Database credentials are missing in server/.env. Database connection pool initialization skipped.'
    );
    return null;
  }

  try {
    pool = await oracledb.createPool(poolConfig);
    console.log('🚀 Oracle Database connection pool initialized successfully.');
    return pool;
  } catch (error) {
    console.error('❌ Failed to initialize Oracle Database connection pool:', error.message);
    throw error;
  }
}

/**
 * Checks out a connection from the pool.
 * @returns {Promise<oracledb.Connection>}
 */
export async function getConnection() {
  // If the pool hasn't been initialized yet, try to initialize it
  if (!pool) {
    await initDbPool();
  }

  if (!pool) {
    throw new Error('Database connection pool is not initialized. Please verify your server/.env settings.');
  }

  try {
    return await pool.getConnection();
  } catch (error) {
    console.error('❌ Failed to checkout database connection from pool:', error.message);
    throw error;
  }
}

/**
 * Closes the connection pool on server shutdown.
 */
export async function closeDbPool() {
  if (pool) {
    try {
      await pool.close(10); // Wait up to 10 seconds for checked-out connections to release
      console.log('💤 Oracle Database connection pool closed.');
      pool = null;
    } catch (error) {
      console.error('Error closing Oracle Database connection pool:', error.message);
    }
  }
}
