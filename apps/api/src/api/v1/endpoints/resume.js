// Resume endpoints — mirrors app/api/endpoints/resumes.py + app/api/v1/endpoints/resume.py
// Routes: POST /upload, GET /:id, DELETE /:id

import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import { query } from '../../../core/database.js';
import { requireAuth } from '../../../core/security.js';

const router = Router();

// ─── Multer setup (local storage; swap for S3 in production) ──
const UPLOAD_DIR = 'uploads';
const storage = multer.diskStorage({
  destination: (req, _file, cb) => {
    const dir = path.join(UPLOAD_DIR, req.userId);
    fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (_req, _file, cb) => {
    cb(null, `${uuidv4()}${path.extname(_file.originalname).toLowerCase()}`);
  },
});

const ALLOWED_MIME_TYPES = new Set([
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/plain',
]);

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
  fileFilter: (_req, file, cb) => {
    if (ALLOWED_MIME_TYPES.has(file.mimetype)) {
      cb(null, true);
    } else {
      cb(Object.assign(new Error('Unsupported file type. Use PDF, DOCX, or TXT.'), { status: 400 }));
    }
  },
});

// ─── POST /resume/upload ──────────────────────────────────────
router.post('/upload', requireAuth, upload.single('file'), async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const resumeId = uuidv4();
    const fileUrl = `/uploads/${req.userId}/${req.file.filename}`;
    const fileType = req.file.mimetype;

    // Persist to DB
    await query(
      `INSERT INTO resumes (id, user_id, filename, file_url, file_type, uploaded_at)
       VALUES ($1,$2,$3,$4,$5,NOW())`,
      [resumeId, req.userId, req.file.originalname, fileUrl, fileType]
    );

    // TODO: Queue parsing job (Bull/BullMQ / Redis)

    return res.status(201).json({
      id: resumeId,
      filename: req.file.originalname,
      size_bytes: req.file.size,
      status: 'uploaded',
      message: 'Resume received and queued for parsing',
    });
  } catch (err) {
    next(err);
  }
});

// ─── GET /resume/:resumeId ────────────────────────────────────
router.get('/:resumeId', requireAuth, async (req, res, next) => {
  try {
    const { rows } = await query(
      'SELECT * FROM resumes WHERE id = $1 AND user_id = $2',
      [req.params.resumeId, req.userId]
    );
    if (!rows[0]) return res.status(404).json({ error: 'Resume not found' });
    return res.json(rows[0]);
  } catch (err) {
    next(err);
  }
});

// ─── DELETE /resume/:resumeId ─────────────────────────────────
router.delete('/:resumeId', requireAuth, async (req, res, next) => {
  try {
    const { rows } = await query(
      'SELECT * FROM resumes WHERE id = $1 AND user_id = $2',
      [req.params.resumeId, req.userId]
    );
    if (!rows[0]) return res.status(404).json({ error: 'Resume not found' });

    // Delete local file
    const localPath = rows[0].file_url.replace(/^\//, '');
    if (fs.existsSync(localPath)) fs.unlinkSync(localPath);

    await query('DELETE FROM resumes WHERE id = $1', [req.params.resumeId]);
    return res.status(204).send();
  } catch (err) {
    next(err);
  }
});

export default router;
