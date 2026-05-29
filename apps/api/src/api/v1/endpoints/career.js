import { Router } from "express";
import { requireAuth } from "../../../core/security.js";
import {
  getCareerMemory,
  backfillCareerMemory,
} from "../../../services/careerMemory.js";

const router = Router();

/**
 * GET /career/memory — longitudinal snapshots + skill evolution
 */
router.get("/memory", requireAuth, async (req, res, next) => {
  try {
    const limit = Math.min(parseInt(req.query.limit, 10) || 20, 50);
    const memory = await getCareerMemory(req.userId, { limit });
    res.json(memory);
  } catch (err) {
    next(err);
  }
});

/**
 * POST /career/backfill — import existing analyses into career memory
 */
router.post("/backfill", requireAuth, async (req, res, next) => {
  try {
    const result = await backfillCareerMemory(req.userId);
    const memory = await getCareerMemory(req.userId);
    res.json({ ...result, memory });
  } catch (err) {
    next(err);
  }
});

export default router;
