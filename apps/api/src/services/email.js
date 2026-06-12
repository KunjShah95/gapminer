import { config } from '../core/config.js';
import nodemailer from 'nodemailer';

let smtpTransport = null;

function initSMTP() {
  if (!config.SMTP_HOST || !config.SMTP_USER || !config.SMTP_PASS) return false;
  try {
    smtpTransport = nodemailer.createTransport({
      host: config.SMTP_HOST,
      port: parseInt(config.SMTP_PORT, 10),
      secure: config.SMTP_SECURE === 'true',
      auth: { user: config.SMTP_USER, pass: config.SMTP_PASS },
    });
    return true;
  } catch {
    return false;
  }
}

initSMTP();

export async function sendEmail({ to, subject, html, text }) {
  if (config.ENV === 'development' && !config.SMTP_HOST) {
    console.log(`[EMAIL] To: ${to}, Subject: ${subject}`);
    return { id: `dev-${Date.now()}`, provider: 'console' };
  }

  if (smtpTransport) {
    try {
      const info = await smtpTransport.sendMail({
        from: config.SMTP_FROM || 'noreply@gapminer.com',
        to,
        subject,
        html,
        text,
      });
      return { id: info.messageId, provider: 'smtp' };
    } catch (err) {
      console.error('[EMAIL] SMTP failed:', err.message);
      throw err;
    }
  }

  console.log(`[EMAIL] To: ${to}, Subject: ${subject}`);
  return { id: `console-${Date.now()}`, provider: 'console' };
}
