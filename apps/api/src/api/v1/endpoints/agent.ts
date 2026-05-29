import express from 'express';
import { runGapminerAnalysis, gapminerAgentApp } from '../../../ai/agent.js';
import { prisma } from '../../../core/database.js';
import { requireAuth } from '../../../core/security.js';
import { persistAnalysisResult } from '../../../services/persistAnalysis.js';
import multer from 'multer';

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

const PIPELINE_STEPS = [
  'parse',
  'normalize',
  'match',
  'market',
  'bench',
  'eval',
  'insights',
  'ats',
  'coverLetter',
  'marketTrend',
  'skillProficiency',
];

// -----------------------------------------------------
// GET /skills/taxonomy
// -----------------------------------------------------
router.get('/skills/taxonomy', async (req, res) => {
  try {
    const categories = await prisma.skillCategory.findMany({
      include: {
        skills: {
          include: {
            subSkills: true,
          },
        },
      },
    });
    res.json({ categories });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// -----------------------------------------------------
// POST /parse (Single Resume Parsing)
// -----------------------------------------------------
router.post('/parse', upload.single('resume'), async (req: any, res: any) => {
  try {
    let text = req.body.text;

    if (!text && !req.file) {
      return res.status(400).json({ error: 'Missing resume content.' });
    }

    const result = await gapminerAgentApp.invoke(
      { resumeText: text || 'Raw resume content', jobDescriptionText: '' },
      { recursionLimit: 2 },
    );

    res.json({
      parsedData: result.resumeData,
      status: 'success',
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// -----------------------------------------------------
// POST /analyze (SSE) — LangGraph pipeline + unified SQL persistence
// -----------------------------------------------------
router.post('/analyze', requireAuth, async (req: any, res) => {
  try {
    const { resumeText, jobDescriptionText } = req.body;
    const userId = req.userId as string;

    if (!resumeText || !jobDescriptionText) {
      return res
        .status(400)
        .json({ error: 'resumeText and jobDescriptionText are required' });
    }

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    const sendStep = (name: string) => {
      res.write(
        `data: ${JSON.stringify({ event: 'on_chain_end', name, data: {} })}\n\n`,
      );
    };

    sendStep('parse');

    const finalState = await gapminerAgentApp.invoke({
      resumeText,
      jobDescriptionText,
    });

    for (const step of PIPELINE_STEPS.slice(1)) {
      sendStep(step);
    }

    const analysisId = await persistAnalysisResult(
      userId,
      resumeText,
      jobDescriptionText,
      finalState,
    );

    // Mirror to Prisma for recruiter / future features
    try {
      await prisma.analysis.create({
        data: {
          userId,
          resumeText,
          jobDescriptionText,
          resumeData: (finalState.resumeData as object) ?? {},
          jdData: (finalState.jdData as object) ?? {},
          gapAnalysis: (finalState.gapAnalysis as object) ?? {},
          roadmap: (finalState.roadmap as object) ?? {},
          courseRecommendations:
            (finalState.courseRecommendations as object) ?? {},
          interviewPrep: (finalState.interviewPrep as object) ?? {},
        },
      });
    } catch (prismaErr: any) {
      console.warn('Prisma analysis mirror skipped:', prismaErr.message);
    }

    res.write(`event: done\ndata: ${JSON.stringify({ analysisId })}\n\n`);
    res.end();
  } catch (err: any) {
    console.error('Agent Error:', err);
    if (!res.headersSent) {
      return res.status(500).json({ error: err.message || 'Analysis failed' });
    }
    res.write(
      `event: error\ndata: ${JSON.stringify({ error: err.message || 'Analysis failed' })}\n\n`,
    );
    res.end();
  }
});

// -----------------------------------------------------
// POST /match (Semantic Job Matching)
// -----------------------------------------------------
router.post('/match', requireAuth, async (req: any, res: any) => {
  try {
    const { candidateId, resumeText, jobDescriptionText } = req.body;

    let textToMatch = resumeText;

    if (candidateId) {
      const candidate = await prisma.candidate.findUnique({
        where: { id: candidateId },
      });
      if (!candidate) {
        return res.status(404).json({ error: 'Candidate not found.' });
      }
      textToMatch = candidate.resumeText;
    }

    if (!textToMatch) {
      return res.status(400).json({ error: 'No resume text provided.' });
    }

    const result = await gapminerAgentApp.invoke({
      resumeText: textToMatch,
      jobDescriptionText,
    });

    res.json({
      matchDetails: result.gapAnalysis,
      skillNormalization: result.normalizedSkills,
      skillNormalizationDetail: result.normalizedSkillsDetail || [],
      skillsByCategory: result.skillsByCategory || {},
      parsedData: result.resumeData,
      status: 'success',
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// -----------------------------------------------------
// POST /optimize (ATS Optimization)
// -----------------------------------------------------
router.post('/optimize', requireAuth, async (req: any, res: any) => {
  try {
    const { resumeText, jobDescriptionText } = req.body;

    if (!resumeText || !jobDescriptionText) {
      return res
        .status(400)
        .json({ error: 'Missing resume or job description text.' });
    }

    const result = await gapminerAgentApp.invoke({
      resumeText,
      jobDescriptionText,
    });

    res.json({
      optimization: result.atsOptimization,
      gapAnalysis: result.gapAnalysis,
      status: 'success',
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
