import { withGeminiKey, hasGemini } from './geminiKeys.js';
import { generateOpenAIEmbedding } from './openai.js';
import dotenv from 'dotenv';

// Load environment variables in case this utility is executed independently
dotenv.config();

if (!hasGemini()) {
  console.warn('⚠️ Warning: no Gemini key (GEMINI_API_KEY / GEMINI_API_KEYS) defined in server/.env');
}

/**
 * Embedding provider is chosen ONCE (never switched mid-flight): vectors from different
 * providers live in different spaces, so mixing them silently breaks similarity search.
 * Override with EMBEDDING_PROVIDER=gemini|openai. Default: Gemini if its key exists, else OpenAI.
 * NOTE: changing provider after data is stored requires re-ingesting the old materials.
 */
export function embeddingProvider() {
  const forced = (process.env.EMBEDDING_PROVIDER || '').toLowerCase();
  if (forced === 'openai' || forced === 'gemini') return forced;
  if (hasGemini()) return 'gemini';
  if (process.env.OPENAI_API_KEY) return 'openai';
  return 'gemini';
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function embedOnce(text) {
  if (embeddingProvider() === 'openai') return generateOpenAIEmbedding(text);
  const result = await withGeminiKey((genAI) =>
    genAI.getGenerativeModel({ model: 'gemini-embedding-001' }).embedContent({
      content: { parts: [{ text }] },
      outputDimensionality: 768
    })
  );
  const values = result?.embedding?.values;
  if (!values) throw new Error('Embedding provider returned an empty result.');
  return values;
}

/**
 * Generates a 768-dimensional embedding. Fail-loud with retry/backoff on transient errors.
 */
export async function generateEmbedding(text) {
  if (!text || typeof text !== 'string' || text.trim() === '') {
    throw new Error('Input text must be a valid non-empty string.');
  }
  let lastErr;
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const v = await embedOnce(text);
      if (Array.isArray(v) && v.length === 768) return v;
      throw new Error(`Embedding has wrong dimension: ${v?.length}`);
    } catch (error) {
      lastErr = error;
      const transient = /429|503|500|fetch failed|ECONNRESET|timeout|overloaded/i.test(error.message);
      console.warn(`⚠️ Embedding attempt ${attempt} failed: ${error.message}`);
      if (!transient || attempt === 3) break;
      await sleep(1000 * attempt * attempt);
    }
  }
  throw lastErr;
}

/**
 * Embeds many chunks with bounded concurrency, preserving order.
 */
export async function generateEmbeddings(texts, concurrency = 4) {
  const out = new Array(texts.length);
  let next = 0;
  async function worker() {
    while (true) {
      const i = next++;
      if (i >= texts.length) return;
      out[i] = await generateEmbedding(texts[i]);
    }
  }
  await Promise.all(Array.from({ length: Math.min(concurrency, texts.length) }, worker));
  return out;
}
