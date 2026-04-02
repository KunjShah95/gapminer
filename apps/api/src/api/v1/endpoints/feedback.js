// Feedback endpoint — collect and retrieve user feedback on analyses
import { Router } from "express";
import { query } from "../../../core/database.js";
import { requireAuth } from "../../../core/security.js";

const router = Router();

router.post("/:analysisId", requireAuth, async (req, res, next) => {
  try {
    const { analysisId } = req.params;
    const { rating, comment, category } = req.body;
    const userId = req.userId;

    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ error: "Rating must be between 1 and 5" });
    }

    await query(
      `INSERT INTO feedback (id, analysis_id, user_id, rating, comment, category, created_at)
       VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, NOW())`,
      [analysisId, userId, rating, comment || null, category || null],
    );

    return res
      .status(201)
      .json({ success: true, message: "Feedback submitted" });
  } catch (err) {
    next(err);
  }
});

router.get("/:analysisId", requireAuth, async (req, res, next) => {
  try {
    const { analysisId } = req.params;
    const { rows } = await query(
      "SELECT * FROM feedback WHERE analysis_id = $1 ORDER BY created_at DESC",
      [analysisId],
    );
    return res.json(rows);
  } catch (err) {
    next(err);
  }
});

export default router;
