import { GoogleGenerativeAI } from '@google/generative-ai';
import { generateOpenAIEmbedding } from './openai.js';
import dotenv from 'dotenv';

// Load environment variables in case this utility is executed independently
dotenv.config();

const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
  console.warn('⚠️ Warning: GEMINI_API_KEY is not defined in server/.env');
}

// Initialize the Google Generative AI SDK client
const genAI = new GoogleGenerativeAI(apiKey || 'dummy-key');

/**
 * Generates a 768-dimensional vector embedding for a given text chunk using Gemini's text-embedding-004 model.
 * Fail-loud: throws on provider failure so callers never store meaningless vectors.
 *
 * @param {string} text - The text content to embed.
 * @returns {Promise<number[]>} The vector embedding as an array of floats.
 */
export async function generateEmbedding(text) {
  if (!text || typeof text !== 'string' || text.trim() === '') {
    throw new Error('Input text must be a valid non-empty string.');
  }

  // If OpenAI is configured, use OpenAI embedding!
  if (process.env.OPENAI_API_KEY) {
    try {
      console.log('🤖 Generating 768-dim embedding via OpenAI (text-embedding-3-small)...');
      return await generateOpenAIEmbedding(text);
    } catch (error) {
      console.error('❌ OpenAI embedding generation failed, falling back...', error.message);
    }
  }

  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-embedding-001' });
    const result = await model.embedContent({
      content: { parts: [{ text }] },
      outputDimensionality: 768
    });
    
    if (result && result.embedding && result.embedding.values) {
      return result.embedding.values;
    }
    throw new Error('Embedding provider returned an empty result.');
  } catch (error) {
    console.error('❌ Embedding generation failed:', error.message);
    throw error;
  }
}
