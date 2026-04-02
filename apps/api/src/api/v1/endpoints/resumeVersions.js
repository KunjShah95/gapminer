import { Router } from "express";
import { requireAuth } from "../../../core/security.js";
import { query } from "../../../core/database.js";
import { semanticSimilarity } from "../../../services/transformerModels.js";

const router = Router();

router.post("/:resumeId/version", requireAuth, async (req, res) => {
  try {
    const userId = req.userId;
    const { resumeId } = req.params;
    const { content, changeSummary } = req.body;

    if (!content) {
      return res.status(400).json({ error: "Content is required" });
    }

    const result = await query(
      `INSERT INTO resume_versions (id, resume_id, user_id, content, change_summary, created_at)
       VALUES (gen_random_uuid(), $1, $2, $3, $4, NOW())
       RETURNING *`,
      [resumeId, userId, content, changeSummary || null],
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error("Create version error:", err);
    res.status(500).json({ error: "Failed to create version" });
  }
});

router.get("/:resumeId/versions", requireAuth, async (req, res) => {
  try {
    const userId = req.userId;
    const { resumeId } = req.params;

    const { rows } = await query(
      `SELECT rv.*, 
              LAG(rv.created_at) OVER (ORDER BY rv.created_at DESC) as previous_version_date
       FROM resume_versions rv
       WHERE rv.resume_id = $1 AND rv.user_id = $2
       ORDER BY rv.created_at DESC`,
      [resumeId, userId],
    );

    res.json(rows);
  } catch (err) {
    console.error("Get versions error:", err);
    res.status(500).json({ error: "Failed to fetch versions" });
  }
});

router.post("/diff", requireAuth, async (req, res) => {
  try {
    const { content1, content2 } = req.body;

    if (!content1 || !content2) {
      return res
        .status(400)
        .json({ error: "Both content1 and content2 are required" });
    }

    const similarity = await semanticSimilarity(content1, content2);

    const lines1 = content1.split("\n");
    const lines2 = content2.split("\n");

    const added = lines2.filter((line) => !lines1.includes(line));
    const removed = lines1.filter((line) => !lines2.includes(line));

    res.json({
      similarity: Math.round(similarity * 100),
      addedLines: added.length,
      removedLines: removed.length,
      changes: [
        ...added.map((line) => ({ type: "added", content: line })),
        ...removed.map((line) => ({ type: "removed", content: line })),
      ].slice(0, 50),
    });
  } catch (err) {
    console.error("Diff error:", err);
    res.status(500).json({ error: "Failed to compute diff" });
  }
});

router.post("/:resumeId/restore", requireAuth, async (req, res) => {
  try {
    const userId = req.userId;
    const { resumeId } = req.params;
    const { versionId } = req.body;

    const { rows } = await query(
      "SELECT content FROM resume_versions WHERE id = $1 AND resume_id = $2 AND user_id = $3",
      [versionId, resumeId, userId],
    );

    if (!rows[0]) {
      return res.status(404).json({ error: "Version not found" });
    }

    await query(
      `INSERT INTO resume_versions (id, resume_id, user_id, content, change_summary, created_at)
       VALUES (gen_random_uuid(), $1, $2, $3, $4, NOW())
       RETURNING *`,
      [resumeId, userId, rows[0].content, "Restored from previous version"],
    );

    res.json({ success: true, message: "Version restored" });
  } catch (err) {
    console.error("Restore version error:", err);
    res.status(500).json({ error: "Failed to restore version" });
  }
});

export default router;
