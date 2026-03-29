import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import { prisma } from '../../../core/database.js';
import { requireAuth } from '../../../core/security.js';
import { parseDocument } from '../../../services/documentParser.js';
import { runGapminerAnalysis } from '../../../ai/agent.js';
import { resumeBatchQueue } from '../../../services/batchQueue.js';

const router = Router();

// --- Multer setup (local storage; swap for S3 in production) ---
const UPLOAD_DIR = 'uploads';
const storage = multer.diskStorage({
  destination: (req, _file, cb) => {
    // Note: ensure req.userId is set by requireAuth
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
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
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
 * /api/v1/resume/upload:
 *   post:
 *     summary: Upload a resume for storage
 *     tags: [Resume]
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
 */
router.post('/upload', requireAuth, upload.single('file'), async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const { originalname, filename, mimetype } = req.file;
    const userId = (req as any).userId;

    // Persist to DB using Prisma
    const candidate = await prisma.candidate.create({
      data: {
        userId,
        name: originalname, // Default name to filename
        resumeText: '', // Will be filled after parsing
      }
    });

    return res.status(201).json({
      id: candidate.id,
      filename: originalname,
      status: 'uploaded',
    });
  } catch (err) {
    next(err);
  }
});

/**
 * @openapi
 * /api/v1/resume/parse:
 *   post:
 *     summary: Parse a single resume synchronously
 *     tags: [Resume]
 *     security:
 *       - bearerAuth: []
 */
router.post('/parse', requireAuth, upload.single('file'), async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const buffer = fs.readFileSync(req.file.path);
    const resumeText = await parseDocument(buffer, req.file.mimetype);

    // Call AI Agent (sync)
    const analysisStream = await runGapminerAnalysis(resumeText, "");
    
    // Simple sync collection for this endpoint (await result)
    let finalOutput: any = {};
    for await (const chunk of analysisStream) {
      if (chunk.event === "on_chain_end") {
        finalOutput = chunk.data.output;
      }
    }

    return res.json({
      parsing: 'completed',
      extraction: finalOutput.resumeData,
      skills: finalOutput.normalizedSkills,
    });
  } catch (err) {
    next(err);
  }
});

/**
 * @openapi
 * /api/v1/resume/parse/batch:
 *   post:
 *     summary: Queue multiple resumes for asynchronous parsing via Redis
 *     tags: [Resume]
 *     security:
 *       - bearerAuth: []
 */
router.post('/parse/batch', requireAuth, upload.array('files', 10), async (req, res, next) => {
  try {
    const files = req.files as Express.Multer.File[];
    if (!files || files.length === 0) {
      return res.status(400).json({ error: 'No files uploaded' });
    }

    const userId = (req as any).userId;
    const jobIds = [];

    for (const file of files) {
      // 1. Create candidate record
      const candidate = await prisma.candidate.create({
        data: {
          userId,
          name: file.originalname,
          resumeText: '',
        }
      });

      // 2. Queue the job
      if (resumeBatchQueue) {
        const job = await resumeBatchQueue.add(`parse-${candidate.id}`, {
          resumeId: candidate.id,
          filePath: file.path,
          mimetype: file.mimetype,
        });
        jobIds.push({ candidateId: candidate.id, jobId: job.id });
      } else {
        jobIds.push({ candidateId: candidate.id, jobId: 'sync-mode' });
      }
    }

    return res.json({
      message: `${files.length} resumes queued for processing`,
      jobs: jobIds,
    });
  } catch (err) {
    next(err);
  }
});

/**
 * @openapi
 * /api/v1/resume/{id}:
 *   put:
 *     summary: Update an existing resume/candidate record
 *     tags: [Resume]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               resumeText:
 *                 type: string
 *               name:
 *                 type: string
 */
/**
 * @openapi
 * /api/v1/resume/details/{id}:
 *   get:
 *     summary: Get details of a specific resume
 *     tags: [Resume]
 *     security:
 *       - bearerAuth: []
 */
router.get('/details/:id', requireAuth, async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = (req as any).userId;

    const candidate = await prisma.candidate.findUnique({
      where: { id },
    });

    if (!candidate || (candidate.userId && candidate.userId !== userId)) {
      return res.status(404).json({ error: 'Resume not found' });
    }

    return res.json(candidate);
  } catch (err) {
    next(err);
  }
});

router.put('/:id', requireAuth, async (req, res, next) => {
  try {
    const { id } = req.params;
    const { resumeText, name } = req.body;
    const userId = (req as any).userId;

    const candidate = await prisma.candidate.updateMany({
      where: { id, userId },
      data: {
        ...(resumeText && { resumeText }),
        ...(name && { name }),
      }
    });

    if (candidate.count === 0) {
      return res.status(404).json({ error: 'Resume not found or unauthorized' });
    }

    return res.json({ status: 'updated' });
  } catch (err) {
    next(err);
  }
});

export default router;
