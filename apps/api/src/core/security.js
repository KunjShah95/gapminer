// JWT + bcrypt helpers — mirrors core/security.py

import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { config } from './config.js';

const ALGORITHM = 'HS256';
const SALT_ROUNDS = 12;

// ─── Password ────────────────────────────────────────────────

export const verifyPassword = (plain, hashed) => bcrypt.compareSync(plain, hashed);

export const hashPassword = (password) => bcrypt.hashSync(password, SALT_ROUNDS);

// ─── JWT ─────────────────────────────────────────────────────

export function createAccessToken(payload, expiresInMinutes) {
  const minutes = expiresInMinutes ?? config.ACCESS_TOKEN_EXPIRE_MINUTES;
  return jwt.sign(payload, config.SECRET_KEY, {
    algorithm: ALGORITHM,
    expiresIn: `${minutes}m`,
  });
}

export function decodeToken(token) {
  try {
    return jwt.verify(token, config.SECRET_KEY, { algorithms: [ALGORITHM] });
  } catch {
    return null;
  }
}

// ─── Express middleware ───────────────────────────────────────

/**
 * Authenticate request — attaches req.userId on success.
 * Equivalent to get_current_user_id() Depends in FastAPI.
 */
export function requireAuth(req, res, next) {
  const authHeader = req.headers['authorization'];
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing or invalid Authorization header' });
  }
  const token = authHeader.slice(7);
  const payload = decodeToken(token);
  if (!payload) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
  req.userId = payload.sub;
  req.tokenPayload = payload;
  next();
}

/**
 * Like requireAuth but also loads the full user row from DB.
 * Equivalent to get_current_user() Depends.
 */
export async function requireUser(req, res, next) {
  requireAuth(req, res, async () => {
    const { query } = await import('./database.js');
    const { rows } = await query('SELECT * FROM users WHERE id = $1', [req.userId]);
    if (!rows[0]) {
      return res.status(404).json({ error: 'User not found' });
    }
    req.user = rows[0];
    next();
  });
}
