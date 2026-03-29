import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import { prisma } from '../../../core/database.js';
import { requireAuth } from '../../../core/security.js';
import { parseDocument } from '../../../services/documentParser.js';

const router = Router();

const UPLOAD_DIR = 'uploads';
const storage = multer.diskStorage({
  destination: (req, _file, cb) => {
    const dir = path.join(UPLOAD_DIR, (req as any).userId || 'anonymous');
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
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (ALLOWED_MIME_TYPES.has(file.mimetype)) {
      cb(null, true);
    } else {
      cb(Object.assign(new Error('Unsupported file type. Use PDF, DOCX, or TXT.'), { status: 400 }));
    }
  },
});

/**
 * @openapi
 * /api/v1/parse:
 *   post:
 *     summary: Parse a document (PDF/DOCX) and extract structured data
 *     tags: [Parse]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Successfully parsed document
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                 filename:
 *                   type: string
 *                 parsedData:
 *                   type: object
 *                 skills:
 *                   type: array
 *                   items:
 *                     type: string
 */
router.post('/', requireAuth, upload.single('file'), async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const { originalname, path: filePath, mimetype } = req.file;
    const userId = (req as any).userId;

    const buffer = fs.readFileSync(filePath);
    const resumeText = await parseDocument(buffer, mimetype);

    const candidate = await prisma.candidate.create({
      data: {
        userId,
        name: originalname,
        resumeText,
      }
    });

    const extractedSkills = candidate.skillsFound || [];

    return res.status(201).json({
      id: candidate.id,
      filename: originalname,
      parsedData: candidate.parsedData,
      skills: extractedSkills,
      message: 'Document parsed successfully'
    });
  } catch (err) {
    next(err);
  }
});

/**
 * @openapi
 * /api/v1/parse/text:
 *   post:
 *     summary: Parse raw text and extract structured data
 *     tags: [Parse]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - text
 *             properties:
 *               text:
 *                 type: string
 *                 description: Raw text to parse
 *     responses:
 *       200:
 *         description: Successfully parsed text
 */
router.post('/text', requireAuth, async (req, res, next) => {
  try {
    const { text } = req.body;
    
    if (!text || typeof text !== 'string') {
      return res.status(400).json({ error: 'No text provided' });
    }

    const userId = (req as any).userId;

    const candidate = await prisma.candidate.create({
      data: {
        userId,
        name: 'Text Input',
        resumeText: text,
      }
    });

    return res.status(201).json({
      id: candidate.id,
      parsedData: candidate.parsedData,
      skills: candidate.skillsFound || [],
      message: 'Text parsed successfully'
    });
  } catch (err) {
    next(err);
  }
});

export default router;
