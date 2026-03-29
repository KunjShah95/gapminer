import pdf from 'pdf-parse/lib/pdf-parse.js';
import mammoth from 'mammoth';
import fs from 'fs';
import path from 'path';

/**
 * Service to parse different document types into plain text.
 * Now utilizes Sarvam Vision AI for high-fidelity OCR on PDFs.
 */
export async function parseDocument(buffer: Buffer, mimetype: string): Promise<string> {
  try {
    switch (mimetype) {
      case 'application/pdf':
        // Try Sarvam Vision OCR first if API key is present
        if (process.env.SARVAM_API_KEY) {
          try {
            return await parseWithSarvam(buffer);
          } catch (e) {
            console.error('Sarvam OCR failed, falling back to local pdf-parse:', e);
            return await parsePdf(buffer);
          }
        }
        return await parsePdf(buffer);
      case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
        return await parseDocx(buffer);
      case 'text/plain':
        return buffer.toString('utf-8');
      default:
        return buffer.toString('utf-8');
    }
  } catch (error: any) {
    throw new Error(`Failed to parse document: ${error.message}`);
  }
}

/**
 * Sarvam Document Intelligence (Vision) Integration
 * Extracts structured text/markdown from PDFs using Sarvam AI.
 */
async function parseWithSarvam(buffer: Buffer): Promise<string> {
  const sarvamApiKey = process.env.SARVAM_API_KEY;
  
  // Note: We use the multipart/form-data approach for Sarvam's document-intelligence
  const formData = new FormData();
  // In Node.js environment, the native fetch supports Blob/File or just passing the buffer if using specialized libraries.
  // We'll use the platform standard way.
  const blob = new Blob([new Uint8Array(buffer)], { type: 'application/pdf' });
  formData.append('file', blob, 'resume.pdf');

  const response = await fetch('https://api.sarvam.ai/extractive-ocr', {
    method: 'POST',
    headers: {
      'api-subscription-key': sarvamApiKey || '',
    },
    body: formData,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Sarvam API error (${response.status}): ${errorText}`);
  }

  const result = await response.json();
  // Return the extracted text or markdown depending on the specific Sarvam endpoint used
  return result.data || result.text || '';
}

async function parsePdf(buffer: Buffer): Promise<string> {
  try {
    const data = await pdf(buffer);
    return data.text;
  } catch (error: any) {
    throw new Error(`PDF Parsing error: ${error.message}`);
  }
}

async function parseDocx(buffer: Buffer): Promise<string> {
  try {
    const result = await mammoth.extractRawText({ buffer });
    return result.value;
  } catch (error: any) {
    throw new Error(`DOCX Parsing error: ${error.message}`);
  }
}
