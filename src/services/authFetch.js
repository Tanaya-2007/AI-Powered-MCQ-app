import { supabase } from './supabaseClient';

/**
 * Returns Authorization headers for backend API calls.
 * Uses the current Supabase session access_token when available.
 * Returns {} when logged out or Supabase unconfigured (dev fallback).
 */
export async function getAuthHeaders() {
  try {
    const { data } = await supabase.auth.getSession();
    const token = data?.session?.access_token;
    if (token) return { Authorization: `Bearer ${token}` };
  } catch {
    // ignore — unauthenticated request
  }
  return {};
}

/**
 * fetch wrapper that injects Supabase JWT automatically.
 */
export async function authFetch(url, options = {}) {
  const authHeaders = await getAuthHeaders();
  return fetch(url, {
    ...options,
    headers: {
      ...(options.headers || {}),
      ...authHeaders,
    },
  });
}
