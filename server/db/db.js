import pg from 'pg';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const { Pool } = pg;

// We support either a unified connection string (DATABASE_URL) or a DB_CONNECTION_STRING from .env
const connectionString = process.env.DATABASE_URL || process.env.DB_CONNECTION_STRING;

let pool;
let schemaInitializer = null;
let schemaInitialized = false;

/**
 * Registers the database schema initializer function to prevent circular dependency
 * and allow lazy schema initialization when the pool connects successfully.
 * @param {Function} fn 
 */
export function registerSchemaInitializer(fn) {
  schemaInitializer = fn;
}

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
    // SSL is mandatory for cloud hosting providers like Supabase and Neon.
    // Defaults to rejectUnauthorized=true (secure). Set PGSSL_REJECT_UNAUTHORIZED=false
    // in server/.env only for local dev with self-signed certificates.
    const sslMode = process.env.PGSSLMODE || 'require';
    const isCloudDb = /supabase\.co|pooler\.supabase\.com|neon\.tech/i.test(connectionString || '');
    // For cloud providers (like Supabase connection poolers), self-signed certificate chains
    // require rejectUnauthorized: false unless explicitly set to 'true'.
    const rejectUnauthorized = process.env.PGSSL_REJECT_UNAUTHORIZED === 'true'
      ? true
      : (process.env.PGSSL_REJECT_UNAUTHORIZED === 'false' ? false : !isCloudDb);

    pool = new Pool({
      connectionString,
      ssl: sslMode === 'disable' ? false : { rejectUnauthorized },
    });

    // Test checkout a connection to verify credentials with retries (production grade resilience)
    let client;
    const maxRetries = 3;
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        client = await pool.connect();
        break;
      } catch (err) {
        if (attempt === maxRetries) {
          throw err;
        }
        console.warn(`⚠️ PostgreSQL connection attempt ${attempt} failed: ${err.message}. Retrying in 2 seconds...`);
        await new Promise(res => setTimeout(res, 2000));
      }
    }

    console.log('🚀 PostgreSQL connection pool initialized successfully.');
    client.release();
    return pool;
  } catch (error) {
    console.error('❌ Failed to initialize PostgreSQL connection pool:', error.message);
    pool = null; // Reset pool so it can be re-attempted
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

  // Lazy initialize the schema if not already initialized
  if (pool && !schemaInitialized && schemaInitializer) {
    schemaInitialized = true; // Set flag early to avoid parallel re-entry
    try {
      console.log('🛠️ Dynamically initializing database schema on connection...');
      await schemaInitializer();
    } catch (e) {
      schemaInitialized = false; // Reset to retry on next checkout if it fails
      console.error('❌ Dynamic database schema initialization failed:', e.message);
    }
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
