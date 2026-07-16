import pg from 'pg';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const { Pool } = pg;

// We support either a unified connection string (DATABASE_URL) or a DB_CONNECTION_STRING from .env
const connectionString = process.env.DATABASE_URL || process.env.DB_CONNECTION_STRING;

let pool;

/**
 * Initializes the PostgreSQL Connection Pool.
 */
export async function initDbPool() {
  if (pool) return pool;

  if (!connectionString) {
    console.warn(
      '⚠️ PostgreSQL connection credentials are missing in server/.env. Database connection pool initialization skipped.'
    );
    return null;
  }

  try {
    // Instantiate Postgres connection pool.
    // We add SSL settings, which are mandatory for cloud hosting providers like Supabase and Neon.
    pool = new Pool({
      connectionString,
      ssl: {
        rejectUnauthorized: false // allows connection to hosted databases without installing local SSL certificates
      }
    });

    // Test checkout a connection to verify credentials
    const client = await pool.connect();
    console.log('🚀 PostgreSQL connection pool initialized successfully.');
    client.release();
    return pool;
  } catch (error) {
    console.error('❌ Failed to initialize PostgreSQL connection pool:', error.message);
    throw error;
  }
}

/**
 * Checks out a client connection from the pool.
 * @returns {Promise<pg.PoolClient>}
 */
export async function getConnection() {
  if (!pool) {
    await initDbPool();
  }

  if (!pool) {
    throw new Error('Database connection pool is not initialized. Please verify your server/.env settings.');
  }

  try {
    return await pool.connect();
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
      await pool.end();
      console.log('💤 PostgreSQL connection pool closed.');
      pool = null;
    } catch (error) {
      console.error('Error closing PostgreSQL connection pool:', error.message);
    }
  }
}
