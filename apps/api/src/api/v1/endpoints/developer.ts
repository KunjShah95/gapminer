/**
 * Developer Portal Endpoints
 *
 * Routes (all require auth):
 *   GET  /api/v1/developer/keys          — List API keys
 *   POST /api/v1/developer/keys          — Create API key
 *   DELETE /api/v1/developer/keys/:id    — Revoke API key
 *   GET  /api/v1/developer/usage         — Get usage stats
 */

import { Router } from "express";
import { v4 as uuidv4 } from "uuid";
import crypto from "crypto";
import { requireAuth } from "../../../core/security.js";
import { query } from "../../../core/database.js";

const router = Router();

// All routes require authentication
router.use(requireAuth);

/**
 * Hash an API key for secure storage.
 * We store only the SHA-256 hash, never the raw key.
 */
function hashApiKey(key: string): string {
  return crypto.createHash("sha256").update(key).digest("hex");
}

/**
 * Generate a new API key in format: gpm_xxxxx_xxxxx
 */
function generateApiKey(): string {
  const prefix = "gpm";
  const random1 = crypto.randomBytes(8).toString("hex");
  const random2 = crypto.randomBytes(8).toString("hex");
  return `${prefix}_${random1}_${random2}`;
}

// ─── GET /developer/keys — List keys ──────────────────────────

router.get("/keys", async (req: any, res, next) => {
  try {
    const { rows } = await query(
      `SELECT id, name, created_at, last_used_at, 
              key_prefix || '...' as masked_key,
              permissions
       FROM api_keys 
       WHERE user_id = $1 AND revoked_at IS NULL
       ORDER BY created_at DESC`,
      [req.userId],
    );

    res.json({ keys: rows });
  } catch (err) {
    next(err);
  }
});

// ─── POST /developer/keys — Create key ────────────────────────

router.post("/keys", async (req: any, res, next) => {
  try {
    const { name, permissions = "read" } = req.body;

    if (!name || typeof name !== "string" || name.trim().length === 0) {
      return res.status(400).json({ error: "Key name is required" });
    }

    if (name.length > 64) {
      return res.status(400).json({ error: "Key name too long (max 64 chars)" });
    }

    const id = uuidv4();
    const rawKey = generateApiKey();
    const keyHash = hashApiKey(rawKey);
    const keyPrefix = rawKey.substring(0, 12); // gpm_xxxx_ for display

    await query(
      `INSERT INTO api_keys (id, user_id, key_hash, key_prefix, name, permissions, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, NOW())`,
      [id, req.userId, keyHash, keyPrefix, name.trim(), permissions],
    );

    // Return the raw key once — it won't be shown again
    res.status(201).json({
      id,
      key: rawKey,
      name: name.trim(),
      permissions,
      message:
        "Save this key securely — it will not be shown again. Prefix: " +
        keyPrefix,
    });
  } catch (err) {
    next(err);
  }
});

// ─── DELETE /developer/keys/:id — Revoke key ──────────────────

router.delete("/keys/:id", async (req: any, res, next) => {
  try {
    const { id } = req.params;
    const { rowCount } = await query(
      `UPDATE api_keys SET revoked_at = NOW() WHERE id = $1 AND user_id = $2 AND revoked_at IS NULL`,
      [id, req.userId],
    );

    if ((rowCount ?? 0) === 0) {
      return res.status(404).json({ error: "API key not found or already revoked" });
    }

    res.json({ message: "API key revoked successfully" });
  } catch (err) {
    next(err);
  }
});

// ─── GET /developer/usage — Usage stats ───────────────────────

router.get("/usage", async (req: any, res, next) => {
  try {
    const { rows } = await query(
      `SELECT 
        COUNT(*) as total_requests,
        COUNT(DISTINCT DATE(created_at)) as active_days,
        COALESCE(SUM(CASE WHEN created_at > NOW() - INTERVAL '30 days' THEN 1 ELSE 0 END), 0) as last_30_days
       FROM api_key_usage 
       WHERE user_id = $1`,
      [req.userId],
    );

    const { rows: keyCount } = await query(
      `SELECT COUNT(*) as active_keys FROM api_keys WHERE user_id = $1 AND revoked_at IS NULL`,
      [req.userId],
    );

    res.json({
      activeKeys: parseInt(keyCount[0]?.active_keys) || 0,
      totalRequests: parseInt(rows[0]?.total_requests) || 0,
      activeDays: parseInt(rows[0]?.active_days) || 0,
      last30Days: parseInt(rows[0]?.last_30_days) || 0,
    });
  } catch (err) {
    next(err);
  }
});

export default router;
