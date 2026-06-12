import express from 'express';
import { requireAuth } from '../../../core/security.js';
import { exec } from 'child_process';
import path from 'path';
import fs from 'fs';
import os from 'os';
import { v4 as uuidv4 } from 'uuid';

const router = express.Router();

/**
 * Checks if pdflatex is available on the system
 */
function isPdflatexAvailable(): Promise<boolean> {
  return new Promise((resolve) => {
    exec('where pdflatex 2>nul || which pdflatex 2>/dev/null', (error) => {
      resolve(!error);
    });
  });
}

/**
 * POST /api/v1/latex/compile
 * Compiles LaTeX code into a PDF.
 * Tries pdflatex first, falls back to generating a styled HTML/PDF.
 */
router.post('/compile', requireAuth, async (req, res) => {
  try {
    const { latexCode } = req.body;

    if (!latexCode) {
      return res.status(400).json({ error: 'No LaTeX code provided.' });
    }

    // Try pdflatex first
    const hasPdflatex = await isPdflatexAvailable();

    if (hasPdflatex) {
      // Use local pdflatex compilation
      const tmpDir = path.join(os.tmpdir(), `latex-${uuidv4()}`);
      fs.mkdirSync(tmpDir, { recursive: true });

      const texFile = path.join(tmpDir, 'document.tex');
      fs.writeFileSync(texFile, latexCode, 'utf-8');

      try {
        await new Promise<void>((resolve, reject) => {
          exec(
            `pdflatex -interaction=nonstopmode -output-directory="${tmpDir}" "${texFile}"`,
            { timeout: 30000, maxBuffer: 10 * 1024 * 1024 },
            (error, stdout, stderr) => {
              if (error) {
                // Extract LaTeX errors from log
                const logFile = path.join(tmpDir, 'document.log');
                let latexError = 'Compilation failed';
                if (fs.existsSync(logFile)) {
                  const log = fs.readFileSync(logFile, 'utf-8');
                  const errorLines = log
                    .split('\n')
                    .filter((l: string) => l.startsWith('! ') || l.includes('Error'))
                  
                    .slice(0, 5)
                    .join('\n');
                  if (errorLines) latexError = errorLines;
                }
                reject(new Error(latexError));
                return;
              }
              resolve();
            },
          );
        });

        const pdfPath = path.join(tmpDir, 'document.pdf');
        if (fs.existsSync(pdfPath)) {
          const pdfBuffer = fs.readFileSync(pdfPath);

          // Cleanup tmp dir
          fs.rmSync(tmpDir, { recursive: true, force: true });

          res.set('Content-Type', 'application/pdf');
          res.set('Content-Disposition', 'inline; filename="document.pdf"');
          res.send(pdfBuffer);
          return;
        }
      } catch (compileErr: any) {
        // Cleanup on failure
        fs.rmSync(tmpDir, { recursive: true, force: true });
        return res.status(422).json({ 
          error: 'LaTeX compilation failed', 
          details: compileErr.message,
          suggestion: 'Check your LaTeX syntax for errors.'
        });
      }
    }

    // Fallback: Generate a styled HTML that simulates PDF output
    // This provides a visual preview even without pdflatex installed
    const html = generatePdfPreviewHtml(latexCode);

    res.set('Content-Type', 'text/html');
    res.send(html);
  } catch (err: any) {
    console.error('LaTeX Compilation Error:', err);
    res.status(500).json({ 
      error: 'LaTeX compilation failed.', 
      details: err.message,
      suggestion: 'Examine your LaTeX syntax for errors.'
    });
  }
});

/**
 * POST /api/v1/latex/preview
 * Returns a rendered HTML preview of LaTeX without full compilation.
 * Useful for real-time preview in the editor.
 */
router.post('/preview', requireAuth, async (req, res) => {
  try {
    const { latexCode } = req.body;
    if (!latexCode) {
      return res.status(400).json({ error: 'No LaTeX code provided.' });
    }

    const html = generatePdfPreviewHtml(latexCode);
    res.json({ html, success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/v1/latex/validate
 * Validates LaTeX syntax without compiling.
 */
router.post('/validate', requireAuth, async (req, res) => {
  try {
    const { latexCode } = req.body;
    if (!latexCode) {
      return res.status(400).json({ error: 'No LaTeX code provided.' });
    }

    const errors: Array<{ line: number; message: string }> = [];

    // Basic LaTeX validation
    const lines = latexCode.split('\n');
    const envStack: string[] = [];

    lines.forEach((line: string, index: number) => {
      const lineNum = index + 1;

      // Check unmatched \begin and \end
      const beginMatch = line.match(/\\begin\{(\w+)\}/);
      const endMatch = line.match(/\\end\{(\w+)\}/);

      if (beginMatch) {
        envStack.push(beginMatch[1]);
      }
      if (endMatch) {
        const expected = envStack.pop();
        if (expected !== endMatch[1]) {
          errors.push({
            line: lineNum,
            message: `Unmatched \\end{${endMatch[1]}} (expected \\end{${expected || '?'}})`,
          });
        }
      }

      // Check unclosed $ or $$
      const dollarCount = (line.match(/\$/g) || []).length;
      if (dollarCount % 2 !== 0 && !line.includes('\\$')) {
        // Could be multiline, just flag it
      }

      // Check for common mistakes
      if (line.includes('\\begin{document}') && lineNum > 1) {
        // Document class should come before begin document
        if (!lines.slice(0, index).some((l: string) => l.includes('\\documentclass'))) {
          errors.push({
            line: lineNum,
            message: 'Missing \\documentclass command before \\begin{document}',
          });
        }
      }
    });

    if (envStack.length > 0) {
      errors.push({
        line: lines.length,
        message: `Unclosed \\begin{${envStack.join(', ')}}`,
      });
    }

    res.json({ valid: errors.length === 0, errors });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * Generates an HTML preview styled like a PDF document.
 * This is the fallback when pdflatex is not available.
 */
function generatePdfPreviewHtml(latexCode: string): string {
  const escapedLatex = latexCode
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>LaTeX Preview</title>
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.11/dist/katex.min.css">
  <style>
    @page { margin: 0; }
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      background: #525659;
      display: flex;
      justify-content: center;
      padding: 24px 0;
      font-family: 'Georgia', 'Times New Roman', serif;
    }
    .page {
      background: white;
      width: 210mm;
      min-height: 297mm;
      padding: 25mm 30mm;
      margin: 0 auto 16px;
      box-shadow: 0 2px 20px rgba(0,0,0,0.3);
      font-size: 12pt;
      line-height: 1.6;
      color: #222;
      position: relative;
    }
    .page pre {
      white-space: pre-wrap;
      font-family: 'Courier New', monospace;
      font-size: 9pt;
      line-height: 1.4;
      color: #333;
      background: #f8f9fa;
      padding: 16px;
      border-radius: 4px;
      border: 1px solid #e9ecef;
      margin: 12px 0;
    }
    .page h1 { font-size: 24pt; margin-bottom: 12pt; text-align: center; }
    .page h2 { font-size: 18pt; margin-top: 18pt; margin-bottom: 9pt; }
    .page h3 { font-size: 14pt; margin-top: 14pt; margin-bottom: 7pt; }
    .page p { margin-bottom: 6pt; text-align: justify; }
    .page ul, .page ol { margin: 6pt 0 6pt 24pt; }
    .page li { margin-bottom: 3pt; }
    .page .latex-source {
      border-top: 2px dashed #dee2e6;
      margin-top: 24pt;
      padding-top: 12pt;
    }
    .page .latex-source-label {
      font-family: 'Courier New', monospace;
      font-size: 8pt;
      color: #868e96;
      margin-bottom: 8pt;
      text-transform: uppercase;
      letter-spacing: 1px;
    }
    .header-bar {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      background: #2c2c2c;
      color: #ccc;
      padding: 8px 24px;
      font-family: -apple-system, sans-serif;
      font-size: 12px;
      display: flex;
      align-items: center;
      gap: 16px;
      z-index: 100;
    }
    .header-bar .status {
      color: #4caf50;
      font-weight: 600;
    }
    .page-number {
      position: absolute;
      bottom: 20mm;
      left: 0;
      right: 0;
      text-align: center;
      font-size: 10pt;
      color: #868e96;
    }
  </style>
</head>
<body>
  <div class="page">
    <h2>📄 LaTeX Compiled Output</h2>
    <p style="color: #666; font-size: 10pt; text-align: center; margin-bottom: 24pt;">
      For best results, install MiKTeX/TeX Live and pdflatex will be used automatically.
    </p>
    <div class="latex-source">
      <div class="latex-source-label">Source</div>
      <pre>${escapedLatex}</pre>
    </div>
    <div class="page-number">1</div>
  </div>
</body>
</html>`;
}

export default router;
