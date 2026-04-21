// Email service for sending transactional emails
// Supports password reset, 2FA, account verification

import nodemailer from "nodemailer";
import { config } from "./config.js";

export function escapeHtml(str) {
  if (!str) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

const hasSmtpConfig = Boolean(
  config.SMTP_HOST && config.SMTP_USER && config.SMTP_PASS,
);

const transporter = hasSmtpConfig
  ? nodemailer.createTransport({
      host: config.SMTP_HOST,
      port: parseInt(config.SMTP_PORT || "587", 10),
      secure: config.SMTP_SECURE === "true",
      auth: {
        user: config.SMTP_USER,
        pass: config.SMTP_PASS,
      },
    })
  : null;

const fromEmail = config.SMTP_FROM || "noreply@gapminer.com";

async function sendOrLog(message) {
  if (transporter) {
    return transporter.sendMail(message);
  }

  const link =
    message?.html?.match(/https?:\/\/[^"'\s<]+/)?.[0] || message?.text || "";
  console.log(`[email:fallback] ${message.subject} -> ${message.to}`);
  if (link) {
    console.log(`[email:fallback] ${link}`);
  }
  return { messageId: `fallback-${Date.now()}` };
}

export async function sendPasswordResetEmail(email, resetToken) {
  const resetUrl = `${config.FRONTEND_URL || "http://localhost:3000"}/auth?mode=reset&token=${resetToken}`;

  return sendOrLog({
    from: `GapMiner <${fromEmail}>`,
    to: email,
    subject: "Reset your GapMiner password",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Reset your password</h2>
        <p>You requested a password reset for your GapMiner account.</p>
        <p>Click the button below to reset your password:</p>
        <a href="${resetUrl}" style="display: inline-block; background: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 16px 0;">Reset Password</a>
        <p>Or copy and paste this link: ${resetUrl}</p>
        <p>This link expires in 1 hour.</p>
        <p>If you didn't request this, please ignore this email.</p>
        <hr style="margin-top: 24px; border: none; border-top: 1px solid #eee;">
        <p style="color: #666; font-size: 12px;">GapMiner - AI Career Development Platform</p>
      </div>
    `,
    text: `Reset your GapMiner password. Click here: ${resetUrl}. This link expires in 1 hour.`,
  });
}

export async function sendVerificationEmail(email, verificationToken) {
  const verifyUrl = `${config.FRONTEND_URL || "http://localhost:3000"}/auth/verify-email?token=${verificationToken}`;

  return sendOrLog({
    from: `GapMiner <${fromEmail}>`,
    to: email,
    subject: "Verify your GapMiner email",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Verify your email</h2>
        <p>Welcome to GapMiner! Please verify your email address.</p>
        <p>Click the button below:</p>
        <a href="${verifyUrl}" style="display: inline-block; background: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 16px 0;">Verify Email</a>
        <p>Or copy and paste this link: ${verifyUrl}</p>
        <p>This link expires in 24 hours.</p>
        <hr style="margin-top: 24px; border: none; border-top: 1px solid #eee;">
        <p style="color: #666; font-size: 12px;">GapMiner - AI Career Development Platform</p>
      </div>
    `,
    text: `Verify your GapMiner email. Click here: ${verifyUrl}`,
  });
}

export async function sendTwoFactorCodeEmail(email, code) {
  return sendOrLog({
    from: `GapMiner <${fromEmail}>`,
    to: email,
    subject: "Your GapMiner 2FA code",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Your 2FA Code</h2>
        <p>Your authentication code is:</p>
        <div style="font-size: 32px; font-weight: bold; letter-spacing: 8px; margin: 24px 0;">${code}</div>
        <p>This code expires in 5 minutes.</p>
        <p>If you didn't request this, please secure your account immediately.</p>
        <hr style="margin-top: 24px; border: none; border-top: 1px solid #eee;">
        <p style="color: #666; font-size: 12px;">GapMiner - AI Career Development Platform</p>
      </div>
    `,
    text: `Your GapMiner 2FA code is: ${code}. This code expires in 5 minutes.`,
  });
}

export async function sendPasswordChangedEmail(email) {
  return sendOrLog({
    from: `GapMiner <${fromEmail}>`,
    to: email,
    subject: "Your GapMiner password has been changed",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Password Changed</h2>
        <p>Your password has been successfully changed.</p>
        <p>If you didn't do this, please reset your password immediately.</p>
        <hr style="margin-top: 24px; border: none; border-top: 1px solid #eee;">
        <p style="color: #666; font-size: 12px;">GapMiner - AI Career Development Platform</p>
      </div>
    `,
    text: `Your GapMiner password has been changed. If you didn't do this, please reset your password immediately.`,
  });
}

export default transporter;
