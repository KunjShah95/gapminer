import { Router } from "express";
import { requireAuth } from "../../../core/security.js";
import { rankJobsForResume } from "../../../services/jobMatching.js";

const router = Router();

router.post("/recommend", requireAuth, async (req, res) => {
  try {
    const userId = req.userId;
    const { resumeText } = req.body;

    if (!resumeText) {
      return res.status(400).json({ error: "Resume text is required" });
    }

    const result = await rankJobsForResume(userId, resumeText, { limit: 20 });

    res.json({
      ...result,
      matchingEngine: "embedding_db",
    });
  } catch (err) {
    console.error("Job recommendation error:", err);
    res.status(500).json({ error: "Failed to generate recommendations" });
  }
});

export default router;
