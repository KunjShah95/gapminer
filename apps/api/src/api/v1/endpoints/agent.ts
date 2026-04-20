import express from 'express';
import { runGapminerAnalysis, gapminerAgentApp } from '../../../ai/agent.js';
import { z } from 'zod';
import { prisma } from '../../../core/database.js';
import multer from 'multer';

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

// -----------------------------------------------------
// 1. Zod Schemas
// -----------------------------------------------------
const MatchRequestSchema = z.object({
  candidateId: z.string().uuid().optional(),
  resumeText: z.string().optional(),
  jobDescriptionText: z.string().min(10),
  userId: z.string().uuid(),
});

// -----------------------------------------------------
// 2. GET /skills/taxonomy
// -----------------------------------------------------
router.get('/skills/taxonomy', async (req, res) => {
  try {
    const categories = await prisma.skillCategory.findMany({
      include: {
        skills: {
          include: {
            subSkills: true,
          }
        }
      }
    });
    res.json({ categories });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// -----------------------------------------------------
// 3. POST /parse (Single Resume Parsing)
// -----------------------------------------------------
router.post('/parse', upload.single('resume'), async (req: any, res: any) => {
  try {
    let text = req.body.text;
    
    // In a real prod app, we'd use pdf-parse or similar here for req.file.buffer
    // For this demonstration, we assume text is passed or extracted earlier
    if (!text && !req.file) {
      return res.status(400).json({ error: "Missing resume content." });
    }

    // Run just the 'parse' node of the graph
    const result = await gapminerAgentApp.invoke({ resumeText: text || "Raw resume content", jobDescriptionText: "" }, { recursionLimit: 2 });
    
    res.json({ 
      parsedData: result.resumeData,
      status: "success"
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// -----------------------------------------------------
// 4. POST /analyze (SSE Stream for legacy UI)
// -----------------------------------------------------
router.post('/analyze', async (req, res) => {
  try {
    const { resumeText, jobDescriptionText, userId } = req.body;

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    const stream = await runGapminerAnalysis(resumeText, jobDescriptionText);

    let finalAggregatedState: any = {};

    for await (const chunk of stream) {
      if (chunk.event === 'on_chain_end' || chunk.event === 'on_chat_model_stream') {
        res.write(`data: ${JSON.stringify({ event: chunk.event, name: chunk.name, data: chunk.data })}\n\n`);
        if (chunk.event === 'on_chain_end' && chunk.data?.output) {
           finalAggregatedState = { ...finalAggregatedState, ...chunk.data.output };
        }
      }
    }

    if (userId) {
      await prisma.analysis.create({
        data: {
          userId,
          resumeText,
          jobDescriptionText,
          resumeData: finalAggregatedState.resumeData ?? {},
          jdData: finalAggregatedState.jdData ?? {},
          gapAnalysis: finalAggregatedState.gapAnalysis ?? {},
          roadmap: finalAggregatedState.roadmap ?? {},
          courseRecommendations: finalAggregatedState.courseRecommendations ?? {},
          interviewPrep: finalAggregatedState.interviewPrep ?? {},
        }
      });

      if (finalAggregatedState.normalizedSkillsDetail?.length > 0) {
        const candidate = await prisma.candidate.findFirst({
          where: { resumeText },
          orderBy: { createdAt: 'desc' }
        });
        if (candidate) {
          await prisma.candidate.update({
            where: { id: candidate.id },
            data: { skillsFound: finalAggregatedState.normalizedSkills }
          });
        }
      }
    }

    res.write('event: done\ndata: {}\n\n');
    res.end();
  } catch (err: any) {
    console.error('Agent Error:', err);
    if (!res.headersSent) {
      return res.status(500).json({ error: err.message || 'Analysis failed' });
    }
    res.write(`event: error\ndata: ${JSON.stringify({ error: err.message || 'Analysis failed' })}\n\n`);
    res.end();
  }
});

// -----------------------------------------------------
// 5. POST /match (Semantic Job Matching)
// -----------------------------------------------------
router.post('/match', async (req: any, res: any) => {
  try {
    const { candidateId, resumeText, jobDescriptionText } = req.body;

    let textToMatch = resumeText;

    if (candidateId) {
      // @ts-ignore - Prisma types might be syncing
      const candidate = await prisma.candidate.findUnique({ where: { id: candidateId } });
      if (!candidate) return res.status(404).json({ error: "Candidate not found." });
      textToMatch = candidate.resumeText;
    }

    if (!textToMatch) return res.status(400).json({ error: "No resume text provided." });

    // Run the full pipeline (parse -> normalize -> match)
    const result = await gapminerAgentApp.invoke({ 
      resumeText: textToMatch, 
      jobDescriptionText 
    });

    res.json({
      matchDetails: result.gapAnalysis,
      skillNormalization: result.normalizedSkills,
      skillNormalizationDetail: result.normalizedSkillsDetail || [],
      skillsByCategory: result.skillsByCategory || {},
      parsedData: result.resumeData,
      status: "success"
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// -----------------------------------------------------
// 6. POST /optimize (ATS Optimization)
// -----------------------------------------------------
router.post('/optimize', async (req: any, res: any) => {
  try {
    const { resumeText, jobDescriptionText } = req.body;

    if (!resumeText || !jobDescriptionText) {
      return res.status(400).json({ error: "Missing resume or job description text." });
    }

    // Run the full pipeline including ATS optimization
    const result = await gapminerAgentApp.invoke({ 
      resumeText, 
      jobDescriptionText 
    });

    res.json({
      optimization: result.atsOptimization,
      gapAnalysis: result.gapAnalysis,
      status: "success"
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;



