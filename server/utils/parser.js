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

    // Use gemini-3.8-flash and gemini-3.6-flash with retry and fallback
    const candidateModels = ['gemini-3.8-flash', 'gemini-3.6-flash'];
    const imagePart = fileToGenerativePart(filePath, mimeType);
    const prompt = `
      Perform Optical Character Recognition (OCR) on this textbook image. 
      Transcribe all visible printed and handwritten text word-for-word. 
      Do not add any headings, intros, summaries, or explanations. 
      Return only the plain transcribed text.
    `;

    let lastError = null;
    for (const modelName of candidateModels) {
      for (let attempt = 1; attempt <= 2; attempt++) {
        try {
          console.log(`📸 Running visual OCR via ${modelName} (attempt ${attempt})...`);
          const model = genAI.getGenerativeModel({ model: modelName });
          const result = await model.generateContent([prompt, imagePart]);
          const response = await result.response;
          const extractedText = response.text() || '';
          if (extractedText.trim()) {
            console.log(`✅ Visual OCR succeeded via ${modelName}! Extracted ${extractedText.trim().length} characters.`);
            return extractedText;
          }
        } catch (err) {
          lastError = err;
          console.warn(`⚠️ Visual OCR via ${modelName} attempt ${attempt} failed: ${err.message}`);
          if (err.message && (err.message.includes('503') || err.message.includes('high demand') || err.message.includes('429'))) {
            // Wait 1.5 seconds before retrying next attempt/model
            await new Promise(r => setTimeout(r, 1500));
          }
        }
      }
    }

    console.error('Error performing visual OCR via Gemini:', lastError);
    throw new Error(`Failed to extract text from image: ${lastError ? lastError.message : 'Unknown OCR error'}`);
  }

  throw new Error(`Unsupported file type: ${mimeType}. We only support text, PDF, and textbook images.`);
}
