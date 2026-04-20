// Auth endpoints — sign-up, login, password reset, password change, and 2FA.

import { Router } from "express";
import crypto from "crypto";
import { v4 as uuidv4 } from "uuid";
import { query } from "../../../core/database.js";
import {
  buildOtpAuthUrl,
  generateTotpSecret,
  hashPassword,
  requireUser,
  verifyPassword,
  verifyTotpCode,
  createAccessToken,
} from "../../../core/security.js";
import {
  sendPasswordChangedEmail,
  sendPasswordResetEmail,
  sendVerificationEmail,
} from "../../../core/email.js";

const router = Router();

function serializeUser(user) {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    avatar: user.avatar ?? null,
    plan: user.plan ?? "free",
    created_at: user.createdAt,
    analyses_used: user.analysesUsed ?? 0,
    analyses_limit: user.analysesLimit ?? 10,
    two_factor_enabled: user.twoFactorEnabled ?? false,
    is_verified: user.isVerified ?? false,
  };
}

async function findUserByEmail(email) {
  const { rows } = await query("SELECT * FROM users WHERE email = $1", [email]);
  return rows[0] ?? null;
}

async function issueUserToken(user) {
  return createAccessToken({ sub: user.id, email: user.email });
}

// ─── POST /register ───────────────────────────────────────────
router.post("/register", async (req, res, next) => {
  try {
    const { email, name, password } = req.body;
    if (!email || !name || !password) {
      return res
        .status(422)
        .json({ error: "email, name and password are required" });
    }

    if (password.length < 8) {
      return res
        .status(422)
        .json({ error: "Password must be at least 8 characters" });
    }

    const existing = await query("SELECT id FROM users WHERE email = $1", [
      email,
    ]);
    if (existing.rows.length) {
      return res.status(400).json({ error: "Email already registered" });
    }

    const id = uuidv4();
    const hashed_password = hashPassword(password);

    const { rows } = await query(
      `INSERT INTO users (
        id, email, name, hashed_password, plan, is_active, is_verified,
        analyses_used, analyses_limit, two_factor_enabled, created_at
      ) VALUES ($1,$2,$3,$4,'free',TRUE,FALSE,0,1,FALSE,NOW())
      RETURNING *`,
      [id, email, name, hashed_password],
    );
    const user = rows[0];
    const access_token = await issueUserToken(user);

    const verificationToken = crypto.randomBytes(32).toString("hex");
    await query(
      `INSERT INTO email_verification_tokens (id, user_id, token, expires_at)
       VALUES ($1, $2, $3, NOW() + INTERVAL '24 hours')`,
      [uuidv4(), user.id, verificationToken],
    );

    try {
      await sendVerificationEmail(email, verificationToken);
    } catch (e) {
      console.warn("Failed to send verification email:", e.message);
    }

    return res.status(201).json({
      access_token,
      token_type: "bearer",
      user: serializeUser(user),
    });
  } catch (err) {
    next(err);
  }
});

// ─── POST /token (login) ──────────────────────────────────────
router.post("/token", async (req, res, next) => {
  try {
    const email = req.body.username ?? req.body.email;
    const password = req.body.password;
    const otpCode = req.body.otpCode ?? req.body.twoFactorCode ?? req.body.code;

    if (!email || !password) {
      return res
        .status(422)
        .json({ error: "username/email and password are required" });
    }

    const user = await findUserByEmail(email);
    if (!user || !verifyPassword(password, user.hashed_password ?? "")) {
      return res.status(401).json({ error: "Incorrect email or password" });
    }
    if (!user.is_active) {
      return res.status(400).json({ error: "Inactive user" });
    }

    if (user.two_factor_enabled) {
      if (!otpCode) {
        return res.status(206).json({
          requires_2fa: true,
          message: "Please enter your 2FA code",
        });
      }
      if (!verifyTotpCode(user.two_factor_secret ?? "", otpCode)) {
        return res.status(401).json({ error: "Invalid 2FA code" });
      }
    }

    const access_token = await issueUserToken(user);
    return res.json({
      access_token,
      token_type: "bearer",
      user: serializeUser(user),
    });
  } catch (err) {
    next(err);
  }
});

// ─── POST /login (JSON alias) ─────────────────────────────────
router.post("/login", async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const otpCode = req.body.otpCode ?? req.body.twoFactorCode ?? req.body.code;

    if (!email || !password) {
      return res.status(422).json({ error: "email and password are required" });
    }

    const user = await findUserByEmail(email);
    if (!user || !verifyPassword(password, user.hashed_password ?? "")) {
      return res.status(401).json({ error: "Incorrect email or password" });
    }
    if (!user.is_active) {
      return res.status(400).json({ error: "Inactive user" });
    }

    if (user.two_factor_enabled) {
      if (!otpCode) {
        return res.status(206).json({
          requires_2fa: true,
          message: "Please enter your 2FA code",
        });
      }
      if (!verifyTotpCode(user.two_factor_secret ?? "", otpCode)) {
        return res.status(401).json({ error: "Invalid 2FA code" });
      }
    }

    const access_token = await issueUserToken(user);
    return res.json({
      access_token,
      token_type: "bearer",
      user: serializeUser(user),
    });
  } catch (err) {
    next(err);
  }
});

// ─── POST /forgot-password ────────────────────────────────────
router.post("/forgot-password", async (req, res, next) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(422).json({ error: "email is required" });
    }

    const user = await findUserByEmail(email);
    if (!user) {
      return res.json({
        message: "If the email exists, a reset link will be sent",
      });
    }

    const token = crypto.randomBytes(32).toString("hex");
    await query(
      `INSERT INTO password_reset_tokens (id, user_id, token, expires_at)
       VALUES ($1, $2, $3, NOW() + INTERVAL '1 hour')`,
      [uuidv4(), user.id, token],
    );

    await query(
      `UPDATE password_reset_tokens SET used_at = NOW()
       WHERE user_id = $1 AND used_at IS NULL AND token <> $2`,
      [user.id, token],
    );

    try {
      await sendPasswordResetEmail(email, token);
    } catch (e) {
      console.warn("Failed to send password reset email:", e.message);
    }

    return res.json({
      message: "If the email exists, a reset link will be sent",
    });
  } catch (err) {
    next(err);
  }
});

// ─── POST /reset-password ─────────────────────────────────────
router.post("/reset-password", async (req, res, next) => {
  try {
    const { token, password } = req.body;
    if (!token || !password) {
      return res.status(422).json({ error: "token and password are required" });
    }

    if (password.length < 8) {
      return res
        .status(422)
        .json({ error: "Password must be at least 8 characters" });
    }

    const { rows } = await query(
      `SELECT user_id FROM password_reset_tokens
       WHERE token = $1 AND expires_at > NOW() AND used_at IS NULL`,
      [token],
    );

    if (!rows.length) {
      return res.status(400).json({ error: "Invalid or expired reset token" });
    }

    const userId = rows[0].user_id;
    const hashed_password = hashPassword(password);

    await query(
      `UPDATE users SET hashed_password = $1, updated_at = NOW() WHERE id = $2`,
      [hashed_password, userId],
    );

    await query(
      `UPDATE password_reset_tokens SET used_at = NOW()
       WHERE token = $1 AND user_id = $2`,
      [token, userId],
    );

    const userResult = await query("SELECT email FROM users WHERE id = $1", [
      userId,
    ]);
    const userEmail = userResult.rows[0]?.email;
    if (userEmail) {
      try {
        await sendPasswordChangedEmail(userEmail);
      } catch (e) {
        console.warn("Failed to send password change notification:", e.message);
      }
    }

    return res.json({ message: "Password reset successfully" });
  } catch (err) {
    next(err);
  }
});

// ─── POST /change-password ────────────────────────────────────
router.post("/change-password", requireUser, async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res
        .status(422)
        .json({ error: "currentPassword and newPassword are required" });
    }

    if (newPassword.length < 8) {
      return res
        .status(422)
        .json({ error: "Password must be at least 8 characters" });
    }

    const { rows } = await query(
      "SELECT hashed_password FROM users WHERE id = $1",
      [req.userId],
    );
    const user = rows[0];

    if (!user || !verifyPassword(currentPassword, user.hashed_password ?? "")) {
      return res.status(401).json({ error: "Current password is incorrect" });
    }

    const hashed_password = hashPassword(newPassword);
    await query(
      `UPDATE users SET hashed_password = $1, updated_at = NOW() WHERE id = $2`,
      [hashed_password, req.userId],
    );

    try {
      await sendPasswordChangedEmail(req.user.email);
    } catch (e) {
      console.warn("Failed to send password change notification:", e.message);
    }

    return res.json({ message: "Password changed successfully" });
  } catch (err) {
    next(err);
  }
});

// ─── POST /2fa/setup ──────────────────────────────────────────
router.post("/2fa/setup", requireUser, async (req, res, next) => {
  try {
    const secret = generateTotpSecret();

    await query(
      `UPDATE users SET two_factor_secret = $1, two_factor_enabled = FALSE, updated_at = NOW() WHERE id = $2`,
      [secret, req.userId],
    );

    return res.json({
      message: "2FA setup initiated",
      secret,
      otpauthUrl: buildOtpAuthUrl({
        issuer: "Gapminer",
        accountName: req.user.email,
        secret,
      }),
    });
  } catch (err) {
    next(err);
  }
});

// ─── POST /2fa/verify ─────────────────────────────────────────
router.post("/2fa/verify", requireUser, async (req, res, next) => {
  try {
    const { code, secret } = req.body;
    if (!code) {
      return res.status(422).json({ error: "code is required" });
    }

    const { rows } = await query(
      "SELECT two_factor_secret FROM users WHERE id = $1",
      [req.userId],
    );
    const storedSecret = rows[0]?.two_factor_secret;

    if (!storedSecret) {
      return res.status(400).json({ error: "2FA not properly configured" });
    }

    if (secret && secret !== storedSecret) {
      return res.status(400).json({ error: "Invalid 2FA secret" });
    }

    if (!verifyTotpCode(storedSecret, code)) {
      return res.status(400).json({ error: "Invalid 2FA code" });
    }

    await query(
      `UPDATE users SET two_factor_enabled = TRUE, updated_at = NOW() WHERE id = $1`,
      [req.userId],
    );

    return res.json({ message: "2FA enabled successfully" });
  } catch (err) {
    next(err);
  }
});

// ─── POST /2fa/disable ───────────────────────────────────────
router.post("/2fa/disable", requireUser, async (req, res, next) => {
  try {
    const { password } = req.body;
    if (!password) {
      return res.status(422).json({ error: "password is required" });
    }

    const { rows } = await query(
      "SELECT hashed_password, two_factor_enabled FROM users WHERE id = $1",
      [req.userId],
    );
    const user = rows[0];

    if (!user?.two_factor_enabled) {
      return res.status(400).json({ error: "2FA is not enabled" });
    }

    if (!verifyPassword(password, user.hashed_password ?? "")) {
      return res.status(401).json({ error: "Incorrect password" });
    }

    await query(
      `UPDATE users SET two_factor_enabled = FALSE, two_factor_secret = NULL, updated_at = NOW() WHERE id = $1`,
      [req.userId],
    );

    return res.json({ message: "2FA disabled successfully" });
  } catch (err) {
    next(err);
  }
});

// ─── GET /2fa/status ──────────────────────────────────────────
router.get("/2fa/status", requireUser, async (req, res) => {
  const { rows } = await query(
    "SELECT two_factor_enabled FROM users WHERE id = $1",
    [req.userId],
  );
  res.json({ enabled: rows[0]?.two_factor_enabled ?? false });
});

// ─── POST /verify-email ───────────────────────────────────────
router.post("/verify-email", requireUser, async (req, res, next) => {
  try {
    const { rows } = await query(
      "SELECT is_verified, email FROM users WHERE id = $1",
      [req.userId],
    );
    const user = rows[0];

    if (user.is_verified) {
      return res.json({ message: "Email already verified" });
    }

    const token = crypto.randomBytes(32).toString("hex");
    await query(
      `INSERT INTO email_verification_tokens (id, user_id, token, expires_at)
       VALUES ($1, $2, $3, NOW() + INTERVAL '24 hours')`,
      [uuidv4(), req.userId, token],
    );

    try {
      await sendVerificationEmail(user.email, token);
    } catch (e) {
      console.warn("Failed to send verification email:", e.message);
    }

    return res.json({ message: "Verification email sent" });
  } catch (err) {
    next(err);
  }
});

// ─── POST /verify-email/confirm ────────────────────────────────
router.post("/verify-email/confirm", async (req, res, next) => {
  try {
    const { token } = req.body;
    if (!token) {
      return res.status(422).json({ error: "token is required" });
    }

    const { rows } = await query(
      `SELECT user_id FROM email_verification_tokens
       WHERE token = $1 AND expires_at > NOW() AND used_at IS NULL`,
      [token],
    );

    if (!rows.length) {
      return res
        .status(400)
        .json({ error: "Invalid or expired verification token" });
    }

    const userId = rows[0].user_id;
    await query(
      `UPDATE users SET is_verified = TRUE, updated_at = NOW() WHERE id = $1`,
      [userId],
    );

    await query(
      `UPDATE email_verification_tokens SET used_at = NOW() WHERE token = $1`,
      [token],
    );

    return res.json({ message: "Email verified successfully" });
  } catch (err) {
    next(err);
  }
});

// ─── GET /me ──────────────────────────────────────────────────
router.get("/me", requireUser, (req, res) => {
  res.json(serializeUser(req.user));
});

// ─── PUT /me ──────────────────────────────────────────────────
router.put("/me", requireUser, async (req, res, next) => {
  try {
    const { name, avatar } = req.body;
    const updates = [];
    const values = [];
    let idx = 1;

    if (name !== undefined) {
      updates.push(`name = $${idx++}`);
      values.push(name);
    }
    if (avatar !== undefined) {
      updates.push(`avatar = $${idx++}`);
      values.push(avatar);
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: "No fields to update" });
    }

    updates.push(`updated_at = NOW()`);
    values.push(req.userId);
    const { rows } = await query(
      `UPDATE users SET ${updates.join(", ")} WHERE id = $${idx} RETURNING *`,
      values,
    );
    return res.json(serializeUser(rows[0]));
  } catch (err) {
    next(err);
  }
});

// ─── POST /refresh ────────────────────────────────────────────
router.post("/refresh", (_req, res) => {
  res.status(501).json({ error: "Not implemented yet" });
});

// ─── POST /google ─────────────────────────────────────────────
router.post("/google", (_req, res) => {
  res.status(501).json({ error: "Google OAuth not yet implemented" });
});

export default router;
