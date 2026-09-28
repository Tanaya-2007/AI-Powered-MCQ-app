import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
const authDisabled = !supabaseUrl || !supabaseAnonKey;

let supabase = null;
if (!authDisabled) {
  supabase = createClient(supabaseUrl, supabaseAnonKey);
} else {
  console.warn(
    '⚠️ SUPABASE_URL / SUPABASE_ANON_KEY missing — auth middleware running in DEV-OPEN mode (all requests allowed). Set them in server/.env for production.'
  );
}

function extractBearerToken(reqOrToken) {
  if (typeof reqOrToken === 'string') {
    return reqOrToken.startsWith('Bearer ') ? reqOrToken.slice(7) : reqOrToken;
  }
  const header = reqOrToken.headers?.authorization || reqOrToken.headers?.Authorization;
  if (!header) return null;
  const parts = header.split(' ');
  if (parts.length === 2 && parts[0] === 'Bearer') return parts[1];
  return null;
}

export async function verifySupabaseToken(token) {
  if (authDisabled) return { id: 'dev-open-mode', email: null };
  if (!token) throw new Error('Missing auth token');
  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data?.user) {
    throw new Error(error?.message || 'Invalid auth token');
  }
  return data.user;
}

/**
 * Express middleware: requires valid Supabase JWT.
 * Public when Supabase env missing (dev), enforced in production.
 */
export async function requireAuth(req, res, next) {
  if (authDisabled) {
    req.user = null;
    return next();
  }
  try {
    const token = extractBearerToken(req);
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required. Please log in.',
      });
    }
    const user = await verifySupabaseToken(token);
    req.user = user;
    return next();
  } catch (err) {
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired session. Please log in again.',
    });
  }
}

/**
 * Socket helper: verify token from handshake.auth.token (optional for players).
 * Returns user or null (does not throw for missing token — caller decides).
 */
export async function verifySocketToken(token) {
  if (authDisabled) return { id: 'dev-open-mode' };
  if (!token) return null;
  try {
    return await verifySupabaseToken(token);
  } catch {
    return null;
  }
}

export function isAuthEnforced() {
  return !authDisabled;
}
