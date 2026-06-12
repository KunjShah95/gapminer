// Resume endpoints
// Routes: POST /upload, GET /, GET /:id, GET /:id/status, DELETE /:id

import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import { query } from '../../../core/database.js';
import { requireAuth } from '../../../core/security.js';
import { enqueueResumeParsing } from '../../../services/batchQueue.js';

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
    const filePath = req.file.path;

    // Persist to DB with pending parsing status
    await query(
      `INSERT INTO resumes (id, user_id, filename, file_url, file_type, parsing_status, uploaded_at)
       VALUES ($1,$2,$3,$4,$5,'pending',NOW())`,
      [resumeId, req.userId, req.file.originalname, fileUrl, fileType]
    );

    // Enqueue parsing job (runs inline if Redis unavailable)
    enqueueResumeParsing(resumeId, filePath, fileType).catch((err) => {
      console.error(`Background parsing failed for resume ${resumeId}:`, err);
    });

    return res.status(201).json({
      id: resumeId,
      filename: req.file.originalname,
      size_bytes: req.file.size,
      status: 'pending',
      parsing_status: 'pending',
      message: 'Resume uploaded and queued for parsing',
    });
  } catch (err) {
    next(err);
  }
});

// ─── GET /resume/ — list all resumes for the current user ─────
router.get('/', requireAuth, async (req, res, next) => {
  try {
    const { rows } = await query(
      `SELECT id, filename, file_url, file_type, parsing_status, uploaded_at
       FROM resumes
       WHERE user_id = $1
       ORDER BY uploaded_at DESC
       LIMIT 20`,
      [req.userId]
    );
    return res.json(rows);
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

// ─── GET /resume/:resumeId/status — polling endpoint ──────────
router.get('/:resumeId/status', requireAuth, async (req, res, next) => {
  try {
    const { rows } = await query(
      `SELECT id, filename, parsing_status, 
              parsed_data IS NOT NULL as has_parsed_data,
              uploaded_at
       FROM resumes 
       WHERE id = $1 AND user_id = $2`,
      [req.params.resumeId, req.userId]
    );
    
    if (!rows[0]) {
      return res.status(404).json({ error: 'Resume not found' });
    }

    const r = rows[0];
    const status = r.parsing_status;

    return res.json({
      id: r.id,
      filename: r.filename,
      status,
      hasParsedData: r.has_parsed_data,
      uploadedAt: r.uploaded_at,
      // Provide human-readable status messages
      message:
        status === 'pending' ? 'Waiting in queue...' :
        status === 'parsing' ? 'Extracting text and skills...' :
        status === 'completed' ? 'Resume parsed successfully' :
        status === 'failed' ? 'Parsing failed — please re-upload' :
        'Unknown status',
    });
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
