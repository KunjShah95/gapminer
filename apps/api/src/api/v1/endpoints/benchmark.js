import { Router } from "express";
import { requireAuth } from "../../../core/security.js";
import { query } from "../../../core/database.js";
import {
  getEmbedding,
  cosineSimilarity,
} from "../../../services/transformerModels.js";

const router = Router();

router.get("/compare", requireAuth, async (req, res) => {
  try {
    const userId = req.userId;
    const { analysisId } = req.query;

    if (!analysisId) {
      return res.status(400).json({ error: "analysisId is required" });
    }

    const { rows: analyses } = await query(
      `SELECT a.id, a.overall_score, a.normalized_skills, a.gap_analysis, a.created_at
       FROM analyses a
       WHERE a.user_id = $1 AND a.status = 'complete' AND a.id != $2
       ORDER BY a.created_at DESC
       LIMIT 100`,
      [userId, analysisId],
    );

    const { rows: currentAnalysis } = await query(
      "SELECT normalized_skills, overall_score FROM analyses WHERE id = $1",
      [analysisId],
    );

    if (!currentAnalysis[0]) {
      return res.status(404).json({ error: "Analysis not found" });
    }

    const currentSkills = currentAnalysis[0].normalized_skills || [];
    const currentScore = currentAnalysis[0].overall_score || 0;

    const peerComparisons = analyses.map((a) => {
      const peerSkills = a.normalized_skills || [];
      const peerScore = a.overall_score || 0;

      const sharedSkills = currentSkills.filter((s) => peerSkills.includes(s));
      const uniqueToPeer = peerSkills.filter((s) => !currentSkills.includes(s));
      const missingFromPeer = currentSkills.filter(
        (s) => !peerSkills.includes(s),
      );

      return {
        analysisId: a.id,
        date: a.created_at,
        scoreDiff: currentScore - peerScore,
        sharedSkills: sharedSkills.length,
        uniqueToPeer: uniqueToPeer.length,
        yourAdvantage: missingFromPeer,
      };
    });

    const avgPeerScore =
      analyses.length > 0
        ? analyses.reduce((sum, a) => sum + (a.overall_score || 0), 0) /
          analyses.length
        : 0;

    const percentile =
      analyses.length > 0
        ? Math.round(
            (analyses.filter((a) => (a.overall_score || 0) <= currentScore)
              .length /
              analyses.length) *
              100,
          )
        : 50;

    res.json({
      yourScore: currentScore,
      avgPeerScore: Math.round(avgPeerScore),
      percentile,
      totalPeers: analyses.length,
      comparisons: peerComparisons.slice(0, 10),
    });
  } catch (err) {
    console.error("Benchmark error:", err);
    res.status(500).json({ error: "Failed to compute benchmark" });
  }
});

router.post("/skill-similarity", requireAuth, async (req, res) => {
  try {
    const { skill1, skill2 } = req.body;
    if (!skill1 || !skill2) {
      return res.status(400).json({ error: "Both skills are required" });
    }

    const [emb1, emb2] = await Promise.all([
      getEmbedding(skill1),
      getEmbedding(skill2),
    ]);

    const similarity = cosineSimilarity(emb1, emb2);

    res.json({
      skill1,
      skill2,
      similarity: Math.round(similarity * 100),
      related: similarity > 0.7,
    });
  } catch (err) {
    console.error("Skill similarity error:", err);
    res.status(500).json({ error: "Failed to compute similarity" });
  }
});

export default router;
