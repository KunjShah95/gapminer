import express from 'express';
import { requireAuth } from '../../../core/security.js';
import axios from 'axios';

const router = express.Router();

/**
 * POST /api/v1/latex/compile
 * Compiles LaTeX code into a PDF using a reliable external proxy or internal engine.
 */
router.post('/compile', requireAuth, async (req, res) => {
  try {
    const { latexCode } = req.body;

    if (!latexCode) {
      return res.status(400).json({ error: "No LaTeX code provided." });
    }

    // Proxy to a reliable open LaTeX compiler API for this session.
    // In a full production env, this would be replaced with a containerized pdflatex executor.
    const response = await axios({
      method: 'get',
      url: 'https://latex.online/compile',
      params: { text: latexCode },
      responseType: 'arraybuffer',
      timeout: 30000,
    });

    res.set('Content-Type', 'application/pdf');
    res.set('Content-Disposition', 'attachment; filename="resume.pdf"');
    res.send(response.data);
  } catch (err: any) {
    console.error('LaTeX Compilation Error:', err);
    res.status(500).json({ 
      error: "LaTeX compilation failed.", 
      details: err.message,
      suggestion: "Examine your LaTeX syntax for errors or check if the external compiler is reachable." 
    });
  }
});

export default router;
