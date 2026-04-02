import { Router } from "express";
import { requireAuth } from "../../../core/security.js";
import { query } from "../../../core/database.js";
import {
  getEmbedding,
  cosineSimilarity,
  extractSkills,
} from "../../../services/transformerModels.js";

const router = Router();

router.post("/recommend", requireAuth, async (req, res) => {
  try {
    const userId = req.userId;
    const { resumeText, preferences } = req.body;

    if (!resumeText) {
      return res.status(400).json({ error: "Resume text is required" });
    }

    const skills = await extractSkills(resumeText);
    const userEmbedding = await getEmbedding(skills.join(", "));

    const { rows: jobs } = await query(
      `SELECT j.*, 
              CASE WHEN j.user_id = $1 THEN 1 ELSE 0 END as is_saved
       FROM job_descriptions j
       WHERE j.raw_text IS NOT NULL AND j.raw_text != ''
       ORDER BY j.created_at DESC
       LIMIT 50`,
      [userId],
    );

    const recommendations = [];

    for (const job of jobs) {
      try {
        const jobSkills = await extractSkills(job.raw_text.substring(0, 3000));
        const jobEmbedding = await getEmbedding(jobSkills.join(", "));
        const similarity = cosineSimilarity(userEmbedding, jobEmbedding);

        const sharedSkills = skills.filter((s) =>
          jobSkills.some((js) => js.toLowerCase() === s.toLowerCase()),
        );

        const missingSkills = jobSkills.filter(
          (js) => !skills.some((s) => s.toLowerCase() === js.toLowerCase()),
        );

        recommendations.push({
          jobId: job.id,
          title: job.title || "Untitled Position",
          company: job.company || "Unknown",
          matchScore: Math.round(similarity * 100),
          sharedSkills: sharedSkills.slice(0, 5),
          missingSkills: missingSkills.slice(0, 5),
          url: job.url || null,
          isSaved: !!job.is_saved,
        });
      } catch {
        continue;
      }
    }

    recommendations.sort((a, b) => b.matchScore - a.matchScore);

    res.json({
      recommendations: recommendations.slice(0, 20),
      totalJobs: jobs.length,
      userSkills: skills,
    });
  } catch (err) {
    console.error("Job recommendation error:", err);
    res.status(500).json({ error: "Failed to generate recommendations" });
  }
});

export default router;
