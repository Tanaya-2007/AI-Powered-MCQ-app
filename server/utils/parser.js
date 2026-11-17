import fs from 'fs';
import { PDFParse } from 'pdf-parse';
import { withGeminiKey, hasGemini, geminiOcrModels } from './geminiKeys.js';
import dotenv from 'dotenv';

dotenv.config();


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

const MIN_PDF_TEXT_CHARS = 40;

const OCR_PROMPT = `Perform Optical Character Recognition (OCR) on this document.
Transcribe all visible printed and handwritten text word-for-word, in reading order.
Do not add headings, intros, summaries, or explanations. Return only the plain transcribed text.`;

/** OCR an image or scanned PDF with Gemini (models + keys are env-configurable and rotate on quota errors). */
async function ocrWithGemini(filePath, mimeType, label) {
  if (!hasGemini()) {
    throw new Error(`Gemini API key is missing. Cannot run OCR for ${label} uploads.`);
  }
  const part = fileToGenerativePart(filePath, mimeType);
  let lastError = null;
  for (const modelName of geminiOcrModels()) {
    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        console.log(`📸 Running OCR via ${modelName} (attempt ${attempt})...`);
        const text = await withGeminiKey(async (genAI) => {
          const result = await genAI.getGenerativeModel({ model: modelName }).generateContent([OCR_PROMPT, part]);
          return result.response.text() || '';
        });
        if (text.trim()) {
          console.log(`✅ OCR succeeded via ${modelName}: ${text.trim().length} characters.`);
          return text;
        }
      } catch (err) {
        lastError = err;
        console.warn(`⚠️ OCR via ${modelName} attempt ${attempt} failed: ${err.message}`);
        if (/503|high demand|429/.test(err.message || '')) await new Promise((r) => setTimeout(r, 1500));
      }
    }
  }
  throw new Error(`Failed to extract text from ${label}: ${lastError ? lastError.message : 'Unknown OCR error'}`);
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
      let text = '';
      const dataBuffer = fs.readFileSync(filePath);
      // pdf-parse v2 API: class-based, must be destroyed to free the worker
      const parser = new PDFParse({ data: new Uint8Array(dataBuffer) });
      try {
        const parsed = await parser.getText();
        // v2 injects "-- N of M --" page markers; strip them so they don't pollute chunks/questions
        text = (parsed.text || '').replace(/^-- \d+ of \d+ --$/gm, '').replace(/\n{3,}/g, '\n\n').trim();
      } finally {
        await parser.destroy().catch(() => {});
      }
      // Scanned/image-only PDFs have no text layer → fall back to Gemini OCR on the PDF itself
      if (text.length < MIN_PDF_TEXT_CHARS && hasGemini()) {
        console.log(`📄 PDF has almost no text layer (${text.length} chars) — running OCR...`);
        try {
          const ocr = await ocrWithGemini(filePath, 'application/pdf', 'PDF');
          if (ocr.trim().length > text.length) return ocr.trim();
        } catch (ocrErr) {
          console.warn('⚠️ PDF OCR fallback failed:', ocrErr.message);
        }
      }
      return text;
    } catch (error) {
      console.error('Error parsing PDF file:', error);
      throw new Error(`Failed to extract text from PDF: ${error.message}`);
    }
  }

  // 3. Handle Textbook Image uploads (multimodal OCR via Gemini)
  if (mimeType.startsWith('image/')) {
    return ocrWithGemini(filePath, mimeType, 'image');
  }

  throw new Error(`Unsupported file type: ${mimeType}. We only support text, PDF, and textbook images.`);
}
