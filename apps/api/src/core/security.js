// JWT + bcrypt helpers — mirrors core/security.py

import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { config } from './config.js';

const ALGORITHM = 'HS256';
const SALT_ROUNDS = 12;

// ─── Password ────────────────────────────────────────────────

export const verifyPassword = (plain, hashed) => bcrypt.compareSync(plain, hashed);

export const hashPassword = (password) => bcrypt.hashSync(password, SALT_ROUNDS);

// ─── Secure tokens ──────────────────────────────────────────

export function generateSecureToken(bytes = 32) {
  return crypto.randomBytes(bytes).toString('hex');
}

export function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

// ─── TOTP / 2FA ──────────────────────────────────────────────

const BASE32_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

function base32Encode(buffer) {
  let bits = 0;
  let value = 0;
  let output = '';

  for (const byte of buffer) {
    value = (value << 8) | byte;
    bits += 8;

    while (bits >= 5) {
      output += BASE32_ALPHABET[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }

  if (bits > 0) {
    output += BASE32_ALPHABET[(value << (5 - bits)) & 31];
  }

  return output;
}

function base32Decode(input) {
  const clean = input.replace(/=+$/g, '').toUpperCase().replace(/[^A-Z2-7]/g, '');
  let bits = 0;
  let value = 0;
  const output = [];

  for (const char of clean) {
    const idx = BASE32_ALPHABET.indexOf(char);
    if (idx === -1) continue;
    value = (value << 5) | idx;
    bits += 5;

    if (bits >= 8) {
      output.push((value >>> (bits - 8)) & 0xff);
      bits -= 8;
    }
  }

  return Buffer.from(output);
}

export function generateTotpSecret() {
  return base32Encode(crypto.randomBytes(20));
}

export function buildOtpAuthUrl({ issuer, accountName, secret }) {
  const label = encodeURIComponent(`${issuer}:${accountName}`);
  const encodedIssuer = encodeURIComponent(issuer);
  return `otpauth://totp/${label}?secret=${secret}&issuer=${encodedIssuer}&algorithm=SHA1&digits=6&period=30`;
}

export function generateTotpCode(secret, counter = Math.floor(Date.now() / 30000), digits = 6) {
  const key = base32Decode(secret);
  const counterBuffer = Buffer.alloc(8);
  counterBuffer.writeBigUInt64BE(BigInt(counter));
  const hmac = crypto.createHmac('sha1', key).update(counterBuffer).digest();
  const offset = hmac[hmac.length - 1] & 0x0f;
  const code = ((hmac.readUInt32BE(offset) & 0x7fffffff) % 10 ** digits).toString().padStart(digits, '0');
  return code;
}

export function verifyTotpCode(secret, code, { window = 1, digits = 6 } = {}) {
  if (!secret || !code) return false;
  const normalized = String(code).trim().replace(/\s+/g, '');
  if (!/^\d+$/.test(normalized)) return false;

  const currentCounter = Math.floor(Date.now() / 30000);
  for (let offset = -window; offset <= window; offset += 1) {
    if (generateTotpCode(secret, currentCounter + offset, digits) === normalized) {
      return true;
    }
  }

  return false;
}

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
