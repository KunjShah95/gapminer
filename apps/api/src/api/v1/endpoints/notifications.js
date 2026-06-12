// Notifications API — user-facing notification feed
// Provides read/unread notification management

import { Router } from "express";
import { query } from "../../../core/database.js";
import { requireUser } from "../../../core/security.js";
import { v4 as uuidv4 } from "uuid";

const router = Router();

// GET /notifications — list user notifications (most recent first)
router.get("/", requireUser, async (req, res, next) => {
  try {
    const { rows } = await query(
      `SELECT id, title, message, type, read, link, created_at
       FROM notifications
       WHERE user_id = $1
       ORDER BY created_at DESC
       LIMIT 50`,
      [req.userId],
    );
    res.json(rows || []);
  } catch (err) {
    next(err);
  }
});

// POST /notifications/:id/read — mark single notification as read
router.post("/:id/read", requireUser, async (req, res, next) => {
  try {
    await query(
      `UPDATE notifications SET read = TRUE WHERE id = $1 AND user_id = $2`,
      [req.params.id, req.userId],
    );
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

// POST /notifications/read-all — mark all user notifications as read
router.post("/read-all", requireUser, async (req, res, next) => {
  try {
    await query(
      `UPDATE notifications SET read = TRUE WHERE user_id = $1 AND read = FALSE`,
      [req.userId],
    );
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

// Helper: create a notification for a user
export async function createNotification({ userId, title, message, type = "system", link = null }) {
  try {
    await query(
      `INSERT INTO notifications (id, user_id, title, message, type, link, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, NOW())`,
      [uuidv4(), userId, title, message, type, link],
    );
  } catch (err) {
    console.warn("[notifications] Failed to create notification:", err.message);
  }
}

export default router;
