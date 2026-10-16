import { Redis } from '@upstash/redis';
import dotenv from 'dotenv';

dotenv.config();

/**
 * Production-Grade Resilient Room Store (Dual-Mode: Upstash Redis with In-Memory Fallback)
 * 
 * - If UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN are set:
 *   Persists room state across server restarts in Redis with automatic 2-hour TTL.
 * - If Redis credentials are not configured or offline:
 *   Gracefully falls back to in-memory Map so local development never breaks.
 */

const ROOM_KEY_PREFIX = 'quizmaster:room:';
const DEFAULT_TTL_SECONDS = 7200; // 2 hours

let redis = null;
let isUsingRedis = false;

// In-memory fallback Map
const memoryRooms = new Map();

if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
  try {
    redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    });
    isUsingRedis = true;
    console.log('🔴 [RoomStore] Initialized Upstash Redis room store.');
  } catch (err) {
    console.warn('⚠️ [RoomStore] Failed to initialize Upstash Redis, falling back to memory store:', err.message);
    redis = null;
    isUsingRedis = false;
  }
} else {
  console.log('ℹ️ [RoomStore] Upstash Redis credentials not found. Using resilient in-memory room store.');
}

export function isRedisActive() {
  return isUsingRedis && redis !== null;
}

/**
 * Get a room by roomCode
 * @param {string} roomCode
 * @returns {Promise<object|null>}
 */
export async function getRoom(roomCode) {
  if (!roomCode) return null;
  const key = `${ROOM_KEY_PREFIX}${roomCode}`;

  if (isRedisActive()) {
    try {
      const data = await redis.get(key);
      if (!data) return null;
      return typeof data === 'string' ? JSON.parse(data) : data;
    } catch (err) {
      console.warn(`[RoomStore] Redis get error for ${roomCode}, falling back to memory:`, err.message);
      return memoryRooms.get(roomCode) || null;
    }
  }

  return memoryRooms.get(roomCode) || null;
}

/**
 * Save or update a room with automatic TTL expiration
 * @param {string} roomCode
 * @param {object} roomData
 * @param {number} ttlSeconds
 * @returns {Promise<boolean>}
 */
export async function setRoom(roomCode, roomData, ttlSeconds = DEFAULT_TTL_SECONDS) {
  if (!roomCode || !roomData) return false;
  const key = `${ROOM_KEY_PREFIX}${roomCode}`;

  // Always mirror to memory for fast local reads & timeouts
  memoryRooms.set(roomCode, roomData);

  if (isRedisActive()) {
    try {
      // Store in Redis with TTL expiration
      await redis.set(key, JSON.stringify(roomData), { ex: ttlSeconds });
      return true;
    } catch (err) {
      console.warn(`[RoomStore] Redis set error for ${roomCode}:`, err.message);
      return false;
    }
  }

  return true;
}

/**
 * Check if a room exists
 * @param {string} roomCode
 * @returns {Promise<boolean>}
 */
export async function hasRoom(roomCode) {
  if (!roomCode) return false;
  const key = `${ROOM_KEY_PREFIX}${roomCode}`;

  if (isRedisActive()) {
    try {
      const exists = await redis.exists(key);
      return exists === 1;
    } catch (err) {
      console.warn(`[RoomStore] Redis exists error for ${roomCode}:`, err.message);
      return memoryRooms.has(roomCode);
    }
  }

  return memoryRooms.has(roomCode);
}

/**
 * Delete a room from storage
 * @param {string} roomCode
 * @returns {Promise<boolean>}
 */
export async function deleteRoom(roomCode) {
  if (!roomCode) return false;
  const key = `${ROOM_KEY_PREFIX}${roomCode}`;

  memoryRooms.delete(roomCode);

  if (isRedisActive()) {
    try {
      await redis.del(key);
      return true;
    } catch (err) {
      console.warn(`[RoomStore] Redis del error for ${roomCode}:`, err.message);
      return false;
    }
  }

  return true;
}

/**
 * Get all active rooms (used for disconnect cleanup & room iteration)
 * @returns {Promise<Array<[string, object]>>}
 */
export async function getAllRooms() {
  if (isRedisActive()) {
    try {
      const keys = await redis.keys(`${ROOM_KEY_PREFIX}*`);
      if (!keys || keys.length === 0) return Array.from(memoryRooms.entries());

      const pairs = [];
      for (const k of keys) {
        const raw = await redis.get(k);
        if (raw) {
          const roomCode = k.replace(ROOM_KEY_PREFIX, '');
          const data = typeof raw === 'string' ? JSON.parse(raw) : raw;
          pairs.push([roomCode, data]);
          memoryRooms.set(roomCode, data); // keep local cache synced
        }
      }
      return pairs;
    } catch (err) {
      console.warn('[RoomStore] Redis getAllRooms error, using memory:', err.message);
      return Array.from(memoryRooms.entries());
    }
  }

  return Array.from(memoryRooms.entries());
}

/**
 * Get active room count
 * @returns {Promise<number>}
 */
export async function getRoomCount() {
  if (isRedisActive()) {
    try {
      const keys = await redis.keys(`${ROOM_KEY_PREFIX}*`);
      return keys ? keys.length : memoryRooms.size;
    } catch (err) {
      return memoryRooms.size;
    }
  }
  return memoryRooms.size;
}
