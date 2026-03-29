import { Router } from 'express';
import { streamText } from 'ai';
import { openai } from '@ai-sdk/openai';
import { z } from 'zod';

const router = Router();

// -------------------------------------------------------------------------
// POST /api/v1/chat
// Handler for the Vercel AI SDK useChat hook in the LaTeX Editor
// -------------------------------------------------------------------------
router.post('/', async (req, res) => {
  const { messages } = req.body;

  try {
    const result = await streamText({
      model: openai('gpt-4o-mini'),
      system: `You are an expert LaTeX and Career Consultant. 
      You help users write professional resumes and career documents in LaTeX. 
      Provide concise, high-quality LaTeX snippets or advice on structure, formatting, and content optimization.
      If the user asks for a specific section, provide the raw LaTeX code for it.`,
      messages,
    });

    return result.pipeTextStreamToResponse(res);
  } catch (error) {
    console.error('Chat Error:', error);
    return res.status(500).json({ error: 'Failed to generate response' });
  }
});

export default router;
