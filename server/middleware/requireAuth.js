import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

// PRODUCTION-ONLY: auth is always enforced. Missing env = fail-closed (deny all),
// never dev-open. Server must have these vars set on Render.
let supabase = null;
if (supabaseUrl && supabaseAnonKey) {
  supabase = createClient(supabaseUrl, supabaseAnonKey);
} else {
  console.error(
    '❌ SUPABASE_URL / SUPABASE_ANON_KEY missing — auth middleware is FAIL-CLOSED. All protected requests will be rejected until server/.env is configured.'
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
  if (!supabase) throw new Error('Server auth misconfigured. Set SUPABASE_URL and SUPABASE_ANON_KEY.');
  if (!token) throw new Error('Missing auth token');
  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data?.user) {
    throw new Error(error?.message || 'Invalid auth token');
  }
  return data.user;
}

/**
 * Express middleware: requires valid Supabase JWT. Always enforced.
 */
export async function requireAuth(req, res, next) {
  if (!supabase) {
    return res.status(500).json({
      success: false,
      message: 'Server auth misconfigured. Contact administrator.',
    });
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
 * Socket helper: verify token from handshake.auth.token.
 * Returns user or null (does not throw for missing token — caller decides).
 * Fail-closed: returns null when server misconfigured.
 */
export async function verifySocketToken(token) {
  if (!supabase) return null;
  if (!token) return null;
  try {
    return await verifySupabaseToken(token);
  } catch {
    return null;
  }
}

export function isAuthEnforced() {
  return true;
}
