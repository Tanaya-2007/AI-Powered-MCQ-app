import { GoogleGenerativeAI } from '@google/generative-ai';
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
 * @param {string} text - The text content to embed.
 * @returns {Promise<number[]>} The vector embedding as an array of floats.
 */
export async function generateEmbedding(text) {
  if (!text || typeof text !== 'string' || text.trim() === '') {
    throw new Error('Input text must be a valid non-empty string.');
  }

  try {
    // text-embedding-004 is the latest robust text embedding model by Google
    const model = genAI.getGenerativeModel({ model: 'text-embedding-004' });
    const result = await model.embedContent(text);
    
    if (result && result.embedding && result.embedding.values) {
      return result.embedding.values;
    } else {
      throw new Error('Failed to retrieve embedding values from Gemini API response.');
    }
  } catch (error) {
    console.error('Error generating embedding with Gemini API:', error);
    throw error;
  }
}
