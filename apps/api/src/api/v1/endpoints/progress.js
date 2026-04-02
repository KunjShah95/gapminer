import { Router } from "express";
import { requireAuth } from "../../../core/security.js";
import { query } from "../../../core/database.js";
import {
  predictMarketTrends,
  semanticSimilarity,
} from "../../../services/transformerModels.js";

const router = Router();

router.get("/:userId", requireAuth, async (req, res) => {
  try {
    const { userId } = req.params;
    if (userId !== req.userId) {
      return res.status(403).json({ error: "Access denied" });
    }

    const { rows: analyses } = await query(
      `SELECT a.id, a.created_at, a.overall_score, a.resume_strength_score, a.ats_score,
              a.gap_analysis, a.normalized_skills
       FROM analyses a
       WHERE a.user_id = $1 AND a.status = 'complete'
       ORDER BY a.created_at ASC`,
      [userId],
    );

    const progressData = analyses.map((a) => ({
      date: a.created_at,
      overallScore: a.overall_score || 0,
      resumeStrength: a.resume_strength_score || 0,
      atsScore: a.ats_score || 0,
      gapsCount: a.gap_analysis?.missingSkills?.length || 0,
      skillsCount: Array.isArray(a.normalized_skills)
        ? a.normalized_skills.length
        : 0,
    }));

    const skillTrends = {};
    for (const analysis of analyses) {
      if (
        analysis.normalized_skills &&
        Array.isArray(analysis.normalized_skills)
      ) {
        for (const skill of analysis.normalized_skills) {
          const skillName =
            typeof skill === "string"
              ? skill
              : skill.name || skill.canonicalName;
          if (!skillTrends[skillName]) {
            skillTrends[skillName] = {
              firstSeen: analysis.created_at,
              analyses: 0,
            };
          }
          skillTrends[skillName].analyses++;
        }
      }
    }

    const masteredSkills = Object.entries(skillTrends)
      .filter(([_, data]) => data.analyses >= 2)
      .map(([skill]) => skill);

    const allSkills = [
      ...new Set(
        analyses.flatMap((a) =>
          Array.isArray(a.normalized_skills)
            ? a.normalized_skills.map((s) =>
                typeof s === "string" ? s : s.name || s.canonicalName,
              )
            : [],
        ),
      ),
    ];

    let marketTrends = [];
    if (allSkills.length > 0) {
      marketTrends = await predictMarketTrends(allSkills.slice(0, 20));
    }

    res.json({
      progress: progressData,
      masteredSkills,
      skillTrends,
      marketTrends,
      totalAnalyses: analyses.length,
    });
  } catch (err) {
    console.error("Get progress error:", err);
    res.status(500).json({ error: "Failed to fetch progress data" });
  }
});

router.get(
  "/compare/:userId/:analysisId1/:analysisId2",
  requireAuth,
  async (req, res) => {
    try {
      const { userId, analysisId1, analysisId2 } = req.params;
      if (userId !== req.userId) {
        return res.status(403).json({ error: "Access denied" });
      }

      const { rows: analyses } = await query(
        "SELECT * FROM analyses WHERE id IN ($1, $2) AND user_id = $3",
        [analysisId1, analysisId2, userId],
      );

      if (analyses.length < 2) {
        return res
          .status(404)
          .json({ error: "One or both analyses not found" });
      }

      const [a1, a2] = analyses;
      const skills1 = new Set(
        Array.isArray(a1.normalized_skills) ? a1.normalized_skills : [],
      );
      const skills2 = new Set(
        Array.isArray(a2.normalized_skills) ? a2.normalized_skills : [],
      );

      const newSkills = [...skills2].filter((s) => !skills1.has(s));
      const lostSkills = [...skills1].filter((s) => !skills2.has(s));
      const retainedSkills = [...skills2].filter((s) => skills1.has(s));

      const scoreDiff = (a2.overall_score || 0) - (a1.overall_score || 0);
      const gapsDiff =
        (a2.gap_analysis?.missingSkills?.length || 0) -
        (a1.gap_analysis?.missingSkills?.length || 0);

      res.json({
        comparison: {
          scoreDiff,
          gapsDiff,
          newSkills,
          lostSkills,
          retainedSkills: retainedSkills.length,
        },
        analysis1: {
          date: a1.created_at,
          score: a1.overall_score,
          gaps: a1.gap_analysis?.missingSkills?.length || 0,
        },
        analysis2: {
          date: a2.created_at,
          score: a2.overall_score,
          gaps: a2.gap_analysis?.missingSkills?.length || 0,
        },
      });
    } catch (err) {
      console.error("Compare analyses error:", err);
      res.status(500).json({ error: "Failed to compare analyses" });
    }
  },
);

export default router;
