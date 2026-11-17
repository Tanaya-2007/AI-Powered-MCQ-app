import { GoogleGenerativeAI } from '@google/generative-ai';

/**
 * Multi-key Gemini support.
 * Put several keys (ideally from SEPARATE Google projects — quota is per project) in
 * GEMINI_API_KEYS=key1,key2,key3  (GEMINI_API_KEY is still honoured and merged in).
 * When one key is rate-limited / out of quota, the next one is used automatically.
 */
const DEFAULT_MODELS = ['gemini-3.5-flash', 'gemini-3.8-flash', 'gemini-flash-latest', 'gemini-3.1-flash-lite', 'gemini-3.5-flash-lite'];
const DEFAULT_OCR_MODELS = ['gemini-3.8-flash', 'gemini-3.6-flash', ...DEFAULT_MODELS];

const csv = (v) => (v || '').split(',').map((s) => s.trim()).filter(Boolean);

export function geminiKeys() {
  return [...new Set([...csv(process.env.GEMINI_API_KEYS), ...csv(process.env.GEMINI_API_KEY)])];
}
export function hasGemini() {
  return geminiKeys().length > 0;
}
export function geminiModels() {
  const fromEnv = csv(process.env.GEMINI_MODELS);
  return fromEnv.length ? fromEnv : DEFAULT_MODELS;
}
export function geminiOcrModels() {
  const fromEnv = csv(process.env.GEMINI_OCR_MODELS);
  return [...new Set(fromEnv.length ? fromEnv : DEFAULT_OCR_MODELS)];
}

// Errors that mean "this KEY is the problem" (try the next key) rather than "this request is bad".
export function isKeyError(err) {
  return /429|quota|RESOURCE_EXHAUSTED|rate limit|401|403|API[_ ]KEY|permission|unregistered callers/i.test(String(err?.message || err));
}

const cooldown = new Map(); // key -> timestamp until which it is skipped
let rr = 0;

/**
 * Runs fn(genAI) with each configured key in turn (round-robin start, skipping keys in cooldown)
 * until one succeeds. Only key-related failures move on to the next key.
 */
export async function withGeminiKey(fn) {
  const keys = geminiKeys();
  if (!keys.length) throw new Error('GEMINI_API_KEY is not configured.');
  const now = Date.now();
  const start = rr++ % keys.length;
  const ordered = keys.map((_, i) => keys[(start + i) % keys.length]);
  const live = ordered.filter((k) => (cooldown.get(k) || 0) <= now);
  const candidates = live.length ? live : ordered; // all cooling down → try anyway
  let lastErr;
  for (const key of candidates) {
    try {
      return await fn(new GoogleGenerativeAI(key));
    } catch (err) {
      lastErr = err;
      if (!isKeyError(err)) throw err;
      cooldown.set(key, Date.now() + 60_000);
      console.warn(`⚠️ Gemini key …${key.slice(-4)} unavailable (${String(err.message).slice(0, 80)}); trying next key.`);
    }
  }
  throw lastErr;
}

/** Tries each model in order on one client; returns first non-empty text. Throws the last error. */
export async function generateWithModels(genAI, prompt, { models = geminiModels(), generationConfig } = {}) {
  let last;
  let keyErr; // remember quota/auth failures so key rotation still triggers even if a later model 404s
  for (const name of models) {
    try {
      const model = genAI.getGenerativeModel({ model: name, ...(generationConfig ? { generationConfig } : {}) });
      const r = await model.generateContent(prompt);
      const text = r?.response?.text();
      if (text) return text;
    } catch (e) {
      last = e;
      if (isKeyError(e)) keyErr = e;
      console.warn(`⚠️ Gemini ${name} failed: ${e.message}`);
    }
  }
  throw keyErr || last || new Error('All Gemini models failed.');
}
