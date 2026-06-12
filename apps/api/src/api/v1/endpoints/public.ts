/**
 * Public API — no authentication required.
 * Read-only endpoints for developer access, badge generation, and shared analyses.
 *
 * Routes:
 *   GET /api/v1/public/badge/:type/:name.svg — SVG skill/proficiency badge
 *   GET /api/v1/public/skills — List all known skills with demand scores
 *   GET /api/v1/public/skills/:name — Get single skill data
 *   GET /api/v1/public/analysis/:shareToken — Get shared analysis (public)
 */

import { Router } from "express";
import { z } from "zod";
import { resolveSkillTrend } from "../../../services/marketDemand.js";
import {
  generateSkillBadge,
  generateProficiencyBadge,
  generateAnalysisBadge,
  type BadgeStyle,
  type BadgeColor,
} from "../../../services/badgeGenerator.js";
import { query } from "../../../core/database.js";

const router = Router();

// ─── GET /public/badge/:type/:name.svg — SVG Badge ────────────

const badgeParamsSchema = z.object({
  type: z.enum(["skill", "proficiency", "analysis"]),
  name: z.string().min(1),
});

router.get("/badge/:type/:name.svg", async (req, res) => {
  try {
    const { type, name } = badgeParamsSchema.parse(req.params);
    const style = (req.query.style as BadgeStyle) || "flat";
    const color = (req.query.color as BadgeColor) || undefined;

    let svg: string;

    if (type === "skill") {
      const trend = await resolveSkillTrend(name);
      svg = generateSkillBadge(name, trend.demandScore, style);
    } else if (type === "proficiency") {
      const level = (req.query.level as string) || "Intermediate";
      svg = generateProficiencyBadge(name, level, style);
    } else {
      // analysis badge — requires ?score=N
      const score = parseInt(req.query.score as string) || 70;
      svg = generateAnalysisBadge(score, style);
    }

    res.setHeader("Content-Type", "image/svg+xml");
    res.setHeader("Cache-Control", "public, max-age=3600, s-maxage=3600");
    res.send(svg);
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: "Invalid badge parameters" });
    }
    res.status(500).json({ error: err.message });
  }
});

// ─── GET /public/skills — List all skills ─────────────────────

router.get("/skills", async (_req, res) => {
  try {
    // Return from the catalog (public read-only)
    const { getTopTrendingSkills } = await import(
      "../../../services/marketDemand.js"
    );
    const skills = await getTopTrendingSkills(undefined, 100);

    res.json({
      skills: skills.map((s: any) => ({
        name: s.skill,
        category: s.category,
        demandScore: s.demandScore,
        trend: s.trend,
        source: s.source,
      })),
      total: skills.length,
      generatedAt: new Date().toISOString(),
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ─── GET /public/skills/:name — Single skill ──────────────────

router.get("/skills/:name", async (req, res) => {
  try {
    const { name } = req.params;
    const trend = await resolveSkillTrend(name);

    res.json({
      skill: trend.skill,
      category: trend.category,
      demandScore: trend.demandScore,
      trend: trend.trend,
      growthRate: trend.growthRate,
      source: trend.source,
      historicalData: trend.historicalData?.slice(-12) || [],
      generatedAt: new Date().toISOString(),
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ─── GET /public/analysis/:shareToken — Shared analysis ───────

router.get("/analysis/:shareToken", async (req, res) => {
  try {
    const { shareToken } = req.params;

    const { rows } = await query(
      `SELECT a.id, a.overall_score, a.resume_strength_score, a.ats_score, 
              a.seniority, a.created_at, a.status,
              r.user_id, u.name as user_name, u.avatar as user_avatar
       FROM analyses a
       JOIN roadmaps r ON a.roadmap_id = r.id
       JOIN users u ON a.user_id = u.id
       WHERE r.share_token = $1 AND a.status = 'complete'`,
      [shareToken],
    );

    if (!rows[0]) {
      return res.status(404).json({ error: "Shared analysis not found" });
    }

    const analysis = rows[0];
    const { rows: gaps } = await query(
      `SELECT skill, category, status, severity, market_demand, radar_score
       FROM skill_gaps WHERE analysis_id = $1 ORDER BY radar_score DESC`,
      [analysis.id],
    );

    res.json({
      analysis: {
        id: analysis.id,
        overallScore: analysis.overall_score,
        resumeStrength: analysis.resume_strength_score,
        atsScore: analysis.ats_score,
        seniority: analysis.seniority,
        createdAt: analysis.created_at,
      },
      user: {
        name: analysis.user_name,
        avatar: analysis.user_avatar,
      },
      skillGaps: gaps.map((g: any) => ({
        skill: g.skill,
        category: g.category,
        status: g.status,
        severity: g.severity,
        marketDemand: g.market_demand,
        score: g.radar_score,
      })),
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
