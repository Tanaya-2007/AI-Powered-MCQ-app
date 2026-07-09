import fs from 'fs';
import * as pdfImport from 'pdf-parse';
const pdf = pdfImport.default || pdfImport;
import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';

dotenv.config();

const apiKey = process.env.GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(apiKey || 'dummy-key');

/**
 * Helper to convert local file data into the structure required by Gemini API for multimodal inputs.
 * 
 * @param {string} filePath - Path to local file.
 * @param {string} mimeType - The MIME type (e.g. image/png).
 * @returns {Object} Multimodal attachment object for Gemini.
 */
function fileToGenerativePart(filePath, mimeType) {
  const fileBuffer = fs.readFileSync(filePath);
  return {
    inlineData: {
      data: fileBuffer.toString('base64'),
      mimeType
    }
  };
}

/**
 * Extracts raw text content from various file formats:
 * - PDF: Parsed using local pdf-parse library.
 * - Text (text/plain): Read directly using utf-8.
 * - Images (image/*): Transcribed using Gemini's multimodal OCR capabilities.
 * 
 * @param {string} filePath - Absolute path to the file on disk.
 * @param {string} mimeType - The MIME type of the file.
 * @returns {Promise<string>} The extracted text content.
 */
export async function extractTextFromFile(filePath, mimeType) {
  if (!fs.existsSync(filePath)) {
    throw new Error(`File not found at path: ${filePath}`);
  }

  // 1. Handle Plain Text files
  if (mimeType === 'text/plain') {
    return fs.readFileSync(filePath, 'utf-8');
  }

  // 2. Handle PDF files
  if (mimeType === 'application/pdf') {
    try {
      const dataBuffer = fs.readFileSync(filePath);
      const parsedData = await pdf(dataBuffer);
      return parsedData.text || '';
    } catch (error) {
      console.error('Error parsing PDF file:', error);
      throw new Error(`Failed to extract text from PDF: ${error.message}`);
    }
  }

  // 3. Handle Textbook Image uploads (multimodal OCR via Gemini)
  if (mimeType.startsWith('image/')) {
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY is missing. Cannot run visual OCR for image uploads.');
    }

    try {
      // Use gemini-1.5-flash as it is extremely fast and optimized for multimodal transcription/OCR tasks
      const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
      const imagePart = fileToGenerativePart(filePath, mimeType);
      
      const prompt = `
        Perform Optical Character Recognition (OCR) on this textbook image. 
        Transcribe all visible printed and handwritten text word-for-word. 
        Do not add any headings, intros, summaries, or explanations. 
        Return only the plain transcribed text.
      `;

      const result = await model.generateContent([prompt, imagePart]);
      const response = await result.response;
      return response.text() || '';
      
    } catch (error) {
      console.error('Error performing visual OCR via Gemini:', error);
      throw new Error(`Failed to extract text from image: ${error.message}`);
    }
  }

  throw new Error(`Unsupported file type: ${mimeType}. We only support text, PDF, and textbook images.`);
}
