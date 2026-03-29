// User endpoints — mirrors app/api/endpoints/users.py
// Routes: GET /me (redirected to auth), GET /:id (admin-facing)

import { Router } from 'express';
import { query } from '../../../core/database.js';
import { requireUser } from '../../../core/security.js';

const router = Router();

// GET /user/me — convenience alias (auth router already handles this)
router.get('/me', requireUser, (req, res) => {
  const u = req.user;
  res.json({
    id: u.id,
    email: u.email,
    name: u.name,
    avatar: u.avatar ?? null,
    plan: u.plan,
    created_at: u.created_at,
    analyses_used: u.analyses_used,
    analyses_limit: u.analyses_limit,
  });
});

// GET /user/:userId — fetch any user (future admin use)
router.get('/:userId', requireUser, async (req, res, next) => {
  try {
    const { rows } = await query('SELECT * FROM users WHERE id = $1', [req.params.userId]);
    if (!rows[0]) return res.status(404).json({ error: 'User not found' });
    const u = rows[0];
    res.json({
      id: u.id,
      email: u.email,
      name: u.name,
      avatar: u.avatar ?? null,
      plan: u.plan,
      analyses_used: u.analyses_used,
      analyses_limit: u.analyses_limit,
    });
  } catch (err) {
    next(err);
  }
});

export default router;
