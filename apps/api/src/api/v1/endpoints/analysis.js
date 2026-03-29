// Analysis endpoints — mirrors app/api/endpoints/analyses.py
// Routes: POST /, GET /:id/stream (SSE), GET /:id, GET /, POST /:id/feedback

import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { query } from '../../../core/database.js';
import { requireAuth, requireUser } from '../../../core/security.js';
import { runAnalysisPipeline } from '../../../services/ai_pipeline.js';

const router = Router();

/**
 * @typedef {Object} AuthRequest
 * @property {string} userId
 */

// ─── POST /analysis/ ─────────────────────────────────────────
router.post('/', requireUser, async (req, res, next) => {
  try {
    const {
      resume_id,
      job_description_id,
      job_description_text,
      job_description_url,
      seniority = 'mid',
    } = req.body;

    const analysisId = uuidv4();
    
    // Create initial analysis record
    await query(
      `INSERT INTO analyses (id, user_id, resume_id, job_description_id, status, seniority, created_at)
       VALUES ($1, $2, $3, $4, 'queued', $5, NOW())`,
      [analysisId, req.userId, resume_id, job_description_id, seniority]
    );

    // Initial steps
    const steps = [
      { id: uuidv4(), label: 'Resume Parsing' },
      { id: uuidv4(), label: 'Market Benchmarking' },
      { id: uuidv4(), label: 'Skill Gap Analysis' },
      { id: uuidv4(), label: 'Roadmap Generation' },
    ];

    for (const step of steps) {
      await query(
        `INSERT INTO analysis_steps (id, analysis_id, label, status)
         VALUES ($1, $2, $3, 'pending')`,
        [step.id, analysisId, step.label]
      );
    }

    // Trigger AI pipeline in background (don't await)
    runAnalysisPipeline(analysisId, {
      resumeId: resume_id,
      jdId: job_description_id,
      jdText: job_description_text,
      seniority
    }).catch(err => console.error(`Analysis ${analysisId} failed:`, err));

    return res.status(202).json({
      id: analysisId,
      status: 'queued',
      message: 'Analysis started.'
    });
  } catch (err) {
    next(err);
  }
});

// ─── GET /analysis/:analysisId/stream (SSE) ──────────────────
router.get('/:analysisId/stream', requireAuth, async (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  const checkStatus = async () => {
    try {
      const { rows: steps } = await query(
        'SELECT label, status, message FROM analysis_steps WHERE analysis_id = $1 ORDER BY started_at ASC',
        [req.params.analysisId]
      );
      
      const { rows: [analysis] } = await query(
        'SELECT status FROM analyses WHERE id = $1',
        [req.params.analysisId]
      );

      res.write(`data: ${JSON.stringify({ status: analysis?.status, steps })}\n\n`);

      if (analysis?.status === 'complete' || analysis?.status === 'failed') {
        clearInterval(interval);
        res.end();
      }
    } catch (err) {
      console.error('SSE Error:', err);
      clearInterval(interval);
      res.end();
    }
  };

  const interval = setInterval(checkStatus, 2000);
  checkStatus();

  req.on('close', () => clearInterval(interval));
});

// ─── GET /analysis/:analysisId ────────────────────────────────
router.get('/:analysisId', requireAuth, async (req, res, next) => {
  try {
    const { rows: [analysis] } = await query(
      'SELECT * FROM analyses WHERE id = $1 AND user_id = $2',
      [req.params.analysisId, req.userId]
    );
    
    if (!analysis) {
      return res.status(404).json({ error: 'Analysis not found' });
    }

    // Fetch related fragments
    const { rows: skillGaps } = await query(
      'SELECT * FROM skill_gaps WHERE analysis_id = $1',
      [analysis.id]
    );

    const { rows: [roadmap] } = await query(
      'SELECT * FROM roadmaps WHERE analysis_id = $1',
      [analysis.id]
    );

    let milestones = [];
    if (roadmap) {
      const { rows: mRows } = await query(
        'SELECT * FROM roadmap_milestones WHERE roadmap_id = $1 ORDER BY week ASC',
        [roadmap.id]
      );
      
      for (const m of mRows) {
        const { rows: resources } = await query(
          'SELECT * FROM learning_resources WHERE milestone_id = $1',
          [m.id]
        );
        milestones.push({
          ...m,
          resources: resources.map(r => ({
            title: r.title,
            url: r.url,
            type: r.type,
            provider: r.provider,
            estimatedHours: r.estimated_hours,
            isFree: r.is_free
          }))
        });
      }
    }

    // Resume/JD data
    const { rows: [resume] } = await query('SELECT filename, parsed_data FROM resumes WHERE id = $1', [analysis.resume_id]);
    const { rows: [jd] } = await query('SELECT title, company, parsed_data FROM job_descriptions WHERE id = $1', [analysis.job_description_id]);

    const missingSkills = skillGaps.filter(g => g.status === 'missing').map(g => g.skill);
    const matchedSkills = skillGaps.filter(g => g.status === 'matched').map(g => g.skill);

    return res.json({
      id: analysis.id,
      status: analysis.status,
      overall_score: analysis.overall_score || 0,
      resume_strength_score: analysis.resume_strength_score || 0,
      ats_score: analysis.ats_score || 0,
      seniority: analysis.seniority || 'mid',
      created_at: analysis.created_at,
      resumeData: resume?.parsed_data || {},
      jdData: jd?.parsed_data || {},
      gapAnalysis: {
        missingSkills,
        matchedSkills,
        matchPercentage: analysis.overall_score || 0,
        criticalGaps: skillGaps.filter(g => g.severity === 'critical').map(g => g.skill),
      },
      roadmap: roadmap ? {
        title: roadmap.title,
        steps: milestones.map(m => ({
          title: m.title,
          description: m.description,
          estimatedTime: `${m.estimated_hours}h`,
          week: m.week,
          skills: m.skills,
          resources: m.resources
        }))
      } : null,
      skillGaps: skillGaps,
    });
  } catch (err) {
    next(err);
  }
});

// ─── GET /analysis/ ───────────────────────────────────────────
router.get('/', requireAuth, async (req, res, next) => {
  try {
    const { rows: analyses } = await query(
      `SELECT a.id, a.status, a.overall_score, a.created_at, r.filename as resume_name
       FROM analyses a
       JOIN resumes r ON a.resume_id = r.id
       WHERE a.user_id = $1
       ORDER BY a.created_at DESC
       LIMIT 20`,
      [req.userId]
    );

    const formatted = [];
    for (const a of analyses) {
      const { rows: topGaps } = await query(
        'SELECT skill, severity, market_demand FROM skill_gaps WHERE analysis_id = $1 AND status = \'missing\' LIMIT 5',
        [a.id]
      );
      formatted.push({
        ...a,
        top_gaps: topGaps.map(g => ({
          skill: g.skill,
          severity: g.severity,
          market_demand: g.market_demand
        }))
      });
    }

    return res.json(formatted);
  } catch (err) {
    next(err);
  }
});

export default router;
