// Auth endpoints — mirrors app/api/endpoints/auth.py + app/api/v1/endpoints/auth.py
// Routes: POST /register, POST /token (login), GET /me, PUT /me, POST /google

import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { query } from '../../../core/database.js';
import {
  hashPassword,
  verifyPassword,
  createAccessToken,
  requireUser,
} from '../../../core/security.js';

const router = Router();

// ─── POST /register ───────────────────────────────────────────
router.post('/register', async (req, res, next) => {
  try {
    const { email, name, password } = req.body;
    if (!email || !name || !password) {
      return res.status(422).json({ error: 'email, name and password are required' });
    }

    const existing = await query('SELECT id FROM users WHERE email = $1', [email]);
    if (existing.rows.length) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    const id = uuidv4();
    const hashed_password = hashPassword(password);

    const { rows } = await query(
      `INSERT INTO users (id, email, name, hashed_password, plan, is_active, is_verified, analyses_used, analyses_limit, created_at)
       VALUES ($1,$2,$3,$4,'free',TRUE,FALSE,0,1,NOW())
       RETURNING *`,
      [id, email, name, hashed_password]
    );
    const user = rows[0];
    const access_token = createAccessToken({ sub: user.id, email: user.email });

    return res.status(201).json({
      access_token,
      token_type: 'bearer',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        avatar: user.avatar ?? null,
        plan: user.plan,
        created_at: user.created_at,
        analyses_used: user.analyses_used,
        analyses_limit: user.analyses_limit,
      }
    });
  } catch (err) {
    next(err);
  }
});

// ─── POST /token (login) ──────────────────────────────────────
router.post('/token', async (req, res, next) => {
  try {
    // Support both JSON body and form-encoded (like OAuth2PasswordRequestForm)
    const email = req.body.username ?? req.body.email;
    const password = req.body.password;

    if (!email || !password) {
      return res.status(422).json({ error: 'username/email and password are required' });
    }

    const { rows } = await query('SELECT * FROM users WHERE email = $1', [email]);
    const user = rows[0];

    if (!user || !verifyPassword(password, user.hashed_password ?? '')) {
      return res.status(401).json({ error: 'Incorrect email or password' });
    }
    if (!user.is_active) {
      return res.status(400).json({ error: 'Inactive user' });
    }

    const access_token = createAccessToken({ sub: user.id, email: user.email });
    return res.json({ access_token, token_type: 'bearer' });
  } catch (err) {
    next(err);
  }
});

// ─── POST /login (JSON alias) ─────────────────────────────────
router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(422).json({ error: 'email and password are required' });
    }
    const { rows } = await query('SELECT * FROM users WHERE email = $1', [email]);
    const user = rows[0];
    if (!user || !verifyPassword(password, user.hashed_password ?? '')) {
      return res.status(401).json({ error: 'Incorrect email or password' });
    }
    const access_token = createAccessToken({ sub: user.id, email: user.email });
    return res.json({
      access_token,
      token_type: 'bearer',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        avatar: user.avatar || null,
        plan: user.plan,
        created_at: user.created_at,
        analyses_used: user.analyses_used,
        analyses_limit: user.analyses_limit,
      }
    });
  } catch (err) {
    next(err);
  }
});

// ─── GET /me ──────────────────────────────────────────────────
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

// ─── PUT /me ──────────────────────────────────────────────────
router.put('/me', requireUser, async (req, res, next) => {
  try {
    const { name, avatar } = req.body;
    const updates = [];
    const values = [];
    let idx = 1;
    if (name !== undefined) { updates.push(`name = $${idx++}`); values.push(name); }
    if (avatar !== undefined) { updates.push(`avatar = $${idx++}`); values.push(avatar); }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    updates.push(`updated_at = NOW()`);
    values.push(req.userId);
    const { rows } = await query(
      `UPDATE users SET ${updates.join(', ')} WHERE id = $${idx} RETURNING *`,
      values
    );
    const u = rows[0];
    return res.json({
      id: u.id,
      email: u.email,
      name: u.name,
      avatar: u.avatar ?? null,
      plan: u.plan,
      created_at: u.created_at,
      analyses_used: u.analyses_used,
      analyses_limit: u.analyses_limit,
    });
  } catch (err) {
    next(err);
  }
});

// ─── POST /refresh ────────────────────────────────────────────
router.post('/refresh', (_req, res) => {
  res.status(501).json({ error: 'Not implemented yet' });
});

// ─── POST /google ─────────────────────────────────────────────
router.post('/google', (_req, res) => {
  // TODO: Implement Google OAuth code exchange
  res.status(501).json({ error: 'Google OAuth not yet implemented' });
});

export default router;
