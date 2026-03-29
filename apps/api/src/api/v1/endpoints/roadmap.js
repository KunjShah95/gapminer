// Roadmap endpoints — mirrors app/api/endpoints/roadmaps.py
// Routes: GET /:id, GET /share/:token, PUT /:id/milestone/:milestoneId

import { Router } from 'express';
import { query } from '../../../core/database.js';
import { requireAuth } from '../../../core/security.js';

const router = Router();

// Helper to build roadmap response shape
function buildRoadmap(roadmap, milestones) {
  return {
    id: roadmap.id,
    title: roadmap.title,
    total_weeks: roadmap.total_weeks,
    total_hours: roadmap.total_hours,
    milestones: milestones.map((m) => ({
      id: m.id,
      week: m.week,
      title: m.title,
      description: m.description,
      skills: m.skills,
      estimated_hours: m.estimated_hours,
      status: m.status,
      resources: (m.resources ?? []).map((r) => ({
        title: r.title,
        url: r.url,
        type: r.type,
        provider: r.provider,
        estimated_hours: r.estimated_hours,
        is_free: r.is_free,
      })),
    })),
  };
}

// ─── GET /roadmap/:roadmapId ──────────────────────────────────
router.get('/:roadmapId', requireAuth, async (req, res, next) => {
  try {
    const { rows: [roadmap] } = await query(
      'SELECT * FROM roadmaps WHERE id = $1 AND user_id = $2',
      [req.params.roadmapId, req.userId]
    );
    if (!roadmap) return res.status(404).json({ error: 'Roadmap not found' });

    const { rows: milestones } = await query(
      'SELECT * FROM roadmap_milestones WHERE roadmap_id = $1 ORDER BY week',
      [roadmap.id]
    );

    for (const m of milestones) {
      const { rows: resources } = await query(
        'SELECT * FROM learning_resources WHERE milestone_id = $1',
        [m.id]
      );
      m.resources = resources;
    }

    return res.json(buildRoadmap(roadmap, milestones));
  } catch (err) {
    next(err);
  }
});

// ─── GET /roadmap/share/:token ────────────────────────────────
router.get('/share/:token', async (req, res, next) => {
  try {
    const { rows: [roadmap] } = await query(
      'SELECT * FROM roadmaps WHERE share_token = $1',
      [req.params.token]
    );
    if (!roadmap) return res.status(404).json({ error: 'Roadmap not found' });

    const { rows: milestones } = await query(
      'SELECT * FROM roadmap_milestones WHERE roadmap_id = $1 ORDER BY week',
      [roadmap.id]
    );
    for (const m of milestones) {
      const { rows: resources } = await query(
        'SELECT title, url, type, is_free FROM learning_resources WHERE milestone_id = $1',
        [m.id]
      );
      m.resources = resources;
    }

    // Public view — omit user_id etc.
    return res.json({
      title: roadmap.title,
      total_weeks: roadmap.total_weeks,
      total_hours: roadmap.total_hours,
      milestones: milestones.map((m) => ({
        week: m.week,
        title: m.title,
        skills: m.skills,
        resources: m.resources,
      })),
    });
  } catch (err) {
    next(err);
  }
});

// ─── PUT /roadmap/:roadmapId/milestone/:milestoneId ───────────
router.put('/:roadmapId/milestone/:milestoneId', requireAuth, async (req, res, next) => {
  try {
    const { status } = req.body;
    if (!status) return res.status(422).json({ error: 'status is required' });

    const { rows: [milestone] } = await query(
      `SELECT rm.* FROM roadmap_milestones rm
       JOIN roadmaps r ON r.id = rm.roadmap_id
       WHERE rm.id = $1 AND rm.roadmap_id = $2 AND r.user_id = $3`,
      [req.params.milestoneId, req.params.roadmapId, req.userId]
    );
    if (!milestone) return res.status(404).json({ error: 'Milestone not found' });

    const completedAt = status === 'completed' ? new Date().toISOString() : null;
    await query(
      'UPDATE roadmap_milestones SET status = $1, completed_at = $2 WHERE id = $3',
      [status, completedAt, milestone.id]
    );

    return res.json({ message: 'Milestone updated' });
  } catch (err) {
    next(err);
  }
});

export default router;
