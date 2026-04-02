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
} from "../../../services/transformerModels.js";

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

    const trends = await predictMarketTrends(skills);
    res.json({ trends });
  } catch (err) {
    console.error("Market trends error:", err);
    res.status(500).json({ error: err.message });
  }
});

export default router;
