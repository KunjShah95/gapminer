// Admin API — protected endpoints for system management
// All endpoints require user with role ADMIN

import { Router } from "express";
import { query } from "../../../core/database.js";
import { requireUser } from "../../../core/security.js";

const router = Router();

// Middleware: ensure admin role
async function requireAdmin(req, res, next) {
  try {
    const { rows } = await query(
      "SELECT role FROM users WHERE id = $1 AND is_active = TRUE",
      [req.userId],
    );
    if (!rows[0] || rows[0].role !== "ADMIN") {
      return res.status(403).json({ error: "Admin access required" });
    }
    next();
  } catch (err) {
    next(err);
  }
}

// GET /admin/stats — system-wide statistics
router.get("/stats", requireUser, requireAdmin, async (req, res, next) => {
  try {
    const [userCount, activeCount, analysisCount, todayAnalysis, resumeCount, premiumCount] =
      await Promise.all([
        query("SELECT COUNT(*)::int as count FROM users"),
        query("SELECT COUNT(*)::int as count FROM users WHERE is_active = TRUE"),
        query("SELECT COUNT(*)::int as count FROM analyses"),
        query(
          "SELECT COUNT(*)::int as count FROM analyses WHERE created_at > NOW() - INTERVAL '24 hours'",
        ),
        query("SELECT COUNT(*)::int as count FROM resumes"),
        query(
          "SELECT COUNT(*)::int as count FROM users WHERE plan IN ('pro', 'teams')",
        ),
      ]);

    res.json({
      totalUsers: userCount.rows[0]?.count || 0,
      activeUsers: activeCount.rows[0]?.count || 0,
      totalAnalyses: analysisCount.rows[0]?.count || 0,
      analysesToday: todayAnalysis.rows[0]?.count || 0,
      totalResumes: resumeCount.rows[0]?.count || 0,
      premiumUsers: premiumCount.rows[0]?.count || 0,
    });
  } catch (err) {
    next(err);
  }
});

// GET /admin/users — list all users (admin only)
router.get("/users", requireUser, requireAdmin, async (req, res, next) => {
  try {
    const { rows } = await query(
      `SELECT id, email, name, plan, analyses_used, created_at, is_active
       FROM users ORDER BY created_at DESC LIMIT 100`,
    );
    res.json(rows);
  } catch (err) {
    next(err);
  }
});

export default router;
