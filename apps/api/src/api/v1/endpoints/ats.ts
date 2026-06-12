import { Router } from "express";
import { prisma } from "../../../core/database.js";
import { requireAuth } from "../../../core/security.js";
import { calculateATSScore } from "../../../services/atsScore.js";

const router = Router();

router.post("/score", requireAuth, async (req, res, next) => {
  try {
    const userId = (req as any).userId;
    const { resumeText, jobDescription } = req.body;

    if (!resumeText || !jobDescription) {
      return res.status(400).json({ error: "resumeText and jobDescription are required" });
    }

    if (typeof resumeText !== "string" || typeof jobDescription !== "string") {
      return res.status(400).json({ error: "resumeText and jobDescription must be strings" });
    }

    const result = calculateATSScore(resumeText, jobDescription);

    const analysis = await prisma.aTSAnalysis.create({
      data: {
        userId,
        resumeText,
        jobDescText: jobDescription,
        score: result.score,
        keywordMatch: result.keywordMatch,
        formatting: result.formatting,
        contentScore: result.contentScore,
        missingSkills: result.missingSkills,
        presentSkills: result.presentSkills,
        suggestions: result.suggestions,
      },
    });

    return res.status(201).json({
      id: analysis.id,
      score: analysis.score,
      keywordMatch: analysis.keywordMatch,
      formatting: analysis.formatting,
      contentScore: analysis.contentScore,
      missingSkills: analysis.missingSkills,
      presentSkills: analysis.presentSkills,
      suggestions: analysis.suggestions,
      createdAt: analysis.createdAt,
    });
  } catch (err) {
    next(err);
  }
});

router.get("/history", requireAuth, async (req, res, next) => {
  try {
    const userId = (req as any).userId;
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit as string) || 10));
    const skip = (page - 1) * limit;

    const [analyses, total] = await Promise.all([
      prisma.aTSAnalysis.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
        select: {
          id: true,
          score: true,
          keywordMatch: true,
          formatting: true,
          createdAt: true,
        },
      }),
      prisma.aTSAnalysis.count({ where: { userId } }),
    ]);

    return res.json({
      analyses,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    next(err);
  }
});

router.get("/:id", requireAuth, async (req, res, next) => {
  try {
    const userId = (req as any).userId;
    const { id } = req.params;

    const analysis = await prisma.aTSAnalysis.findFirst({
      where: { id, userId },
    });

    if (!analysis) {
      return res.status(404).json({ error: "ATS analysis not found" });
    }

    return res.json({
      id: analysis.id,
      score: analysis.score,
      keywordMatch: analysis.keywordMatch,
      formatting: analysis.formatting,
      contentScore: analysis.contentScore,
      missingSkills: analysis.missingSkills,
      presentSkills: analysis.presentSkills,
      suggestions: analysis.suggestions,
      createdAt: analysis.createdAt,
    });
  } catch (err) {
    next(err);
  }
});

export default router;
