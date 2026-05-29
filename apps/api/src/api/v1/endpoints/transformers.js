import { Router } from "express";
import { requireAuth } from "../../../core/security.js";
import {
  classifyJobDescription,
  classifySeniorityLevel,
  classifyWorkArrangement,
  analyzeResumeSentiment,
  generateInterviewQuestions,
  extractSkills,
  predictMarketTrends,
  predictCareerPath,
} from "../../../services/transformerModels.js";
import { getSkillTrendWithTransformer } from "../../../services/marketDemand.js";

function mapTrendLabel(trend) {
  if (trend === "emerging") return "emerging technology";
  if (trend === "declining") return "declining technology";
  if (trend === "stable") return "mainstream skill";
  return trend;
}

const router = Router();

router.post("/classify-jd", requireAuth, async (req, res) => {
  try {
    const { text } = req.body;
    if (!text) return res.status(400).json({ error: "Text is required" });

    const [categories, seniority, arrangement] = await Promise.all([
      classifyJobDescription(text),
      classifySeniorityLevel(text),
      classifyWorkArrangement(text),
    ]);

    res.json({ categories, seniority, arrangement });
  } catch (err) {
    console.error("JD classification error:", err);
    res.status(500).json({ error: err.message });
  }
});

router.post("/analyze-sentiment", requireAuth, async (req, res) => {
  try {
    const { text } = req.body;
    if (!text) return res.status(400).json({ error: "Text is required" });

    const sentiment = await analyzeResumeSentiment(text);
    res.json(sentiment);
  } catch (err) {
    console.error("Sentiment analysis error:", err);
    res.status(500).json({ error: err.message });
  }
});

router.post("/generate-questions", requireAuth, async (req, res) => {
  try {
    const { skills, difficulty } = req.body;
    if (!skills || !Array.isArray(skills)) {
      return res.status(400).json({ error: "Skills array is required" });
    }

    const questions = await generateInterviewQuestions(
      skills,
      difficulty || "medium",
    );
    res.json({ questions });
  } catch (err) {
    console.error("Question generation error:", err);
    res.status(500).json({ error: err.message });
  }
});

router.post("/extract-skills", requireAuth, async (req, res) => {
  try {
    const { text } = req.body;
    if (!text) return res.status(400).json({ error: "Text is required" });

    const skills = await extractSkills(text);
    res.json({ skills });
  } catch (err) {
    console.error("Skill extraction error:", err);
    res.status(500).json({ error: err.message });
  }
});

router.post("/market-trends", requireAuth, async (req, res) => {
  try {
    const { skills } = req.body;
    if (!skills || !Array.isArray(skills)) {
      return res.status(400).json({ error: "Skills array is required" });
    }

    const trends = await Promise.all(
      skills.slice(0, 25).map(async (skill) => {
        const row = await getSkillTrendWithTransformer(skill);
        return {
          skill: row.skill,
          category: row.category,
          trend: mapTrendLabel(row.trend),
          trendDirection: row.trend,
          demandScore: row.demandScore,
          growthRate: row.growthRate,
          source: row.source,
          confidence:
            row.source === "catalog"
              ? 0.92
              : row.source === "database"
                ? 0.85
                : row.source === "transformer"
                  ? 0.78
                  : 0.65,
          historicalData: row.historicalData,
        };
      }),
    );

    res.json({
      trends,
      dataSource: "catalog+database+transformer",
      disclaimer:
        "Demand scores combine curated market catalog, skill taxonomy, and embedding-based signals. Install pgvector for enhanced job matching.",
    });
  } catch (err) {
    console.error("Market trends error:", err);
    res.status(500).json({ error: err.message });
  }
});

router.post("/career-path", requireAuth, async (req, res) => {
  try {
    const { skills } = req.body;
    if (!skills || !Array.isArray(skills)) {
      return res.status(400).json({ error: "Skills array is required" });
    }

    const pathData = await predictCareerPath(skills);
    res.json(pathData);
  } catch (err) {
    console.error("Career path error:", err);
    res.status(500).json({ error: err.message });
  }
});

export default router;
