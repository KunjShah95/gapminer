import { Router } from 'express';
import multer from 'multer';
import { prisma } from '../../../core/database.js';
import { requireAuth } from '../../../core/security.js';
import { gapminerAgentApp } from '../../../ai/agent.js';
import { parseDocument } from '../../../services/documentParser.js';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import fs from 'fs';

const router = Router();

// Middleware to check if user is a recruiter or admin
const requireRecruiter = async (req: any, res: any, next: any) => {
  const user = await prisma.user.findUnique({ where: { id: req.userId } });
  if (user?.role === 'RECRUITER' || user?.role === 'ADMIN') {
    next();
  } else {
    res.status(403).json({ error: 'Access denied. Recruiter or Admin role required.' });
  }
};

/**
 * @openapi
 * /api/v1/recruiter/stats:
 *   get:
 *     summary: Get dashboard statistics for recruiter
 *     tags: [Recruiter]
 *     security:
 *       - bearerAuth: []
 */
router.get('/stats', requireAuth, requireRecruiter, async (req: any, res, next) => {
  try {
    const userId = req.userId;
    
    const [totalCandidates, activeJobs, shortlistedApplications, interviewsScheduled] = await Promise.all([
      prisma.candidate.count(),
      prisma.job.count({ where: { recruiterId: userId, status: 'OPEN' } }),
      prisma.jobApplication.count({ where: { job: { recruiterId: userId }, status: 'REVIEWING' } }),
      prisma.jobApplication.count({ where: { job: { recruiterId: userId }, status: 'INTERVIEWED' } })
    ]);

    // Calculate avg match score
    const appsWithScores = await prisma.jobApplication.findMany({
      where: { job: { recruiterId: userId }, matchScore: { not: null } },
      select: { matchScore: true }
    });
    
    const avgScore = appsWithScores.length > 0 
      ? appsWithScores.reduce((acc: number, curr: any) => acc + (curr.matchScore || 0), 0) / appsWithScores.length
      : 0;

    return res.json({
      activeJobs,
      totalCandidates,
      shortlisted: shortlistedApplications,
      interviewsScheduled,
      avgMatchScore: Math.round(avgScore * 10) / 10 || 75.0,
      hiringVelocity: '12 days',
      talentLiquidity: 84,
      competitivePull: 62
    });
  } catch (err) {
    next(err);
  }
});

/**
 * @openapi
 * /api/v1/recruiter/candidates:
 *   get:
 *     summary: Get candidates list for recruiter dashboard
 *     tags: [Recruiter]
 *     security:
 *       - bearerAuth: []
 */
router.get('/candidates', requireAuth, requireRecruiter, async (req: any, res, next) => {
  try {
    const userId = req.userId;
    const candidates = await prisma.candidate.findMany({
      take: 20,
      orderBy: { updatedAt: 'desc' },
      include: {
        applications: {
          where: { job: { recruiterId: userId } },
          include: { job: true }
        },
        user: true
      }
    });

    const formattedCandidates = candidates.map((c: any) => {
      const topApp = c.applications[0];
      return {
        id: c.id,
        name: c.name || c.user?.name || 'Unknown Candidate',
        role: topApp?.job?.title || 'Unassigned',
        matchScore: topApp?.matchScore || 0,
        status: topApp?.status || 'Sourced',
        lastActive: c.updatedAt,
        skills: (c.skillsFound || []).slice(0, 3)
      };
    });

    return res.json(formattedCandidates);
  } catch (err) {
    next(err);
  }
});

/**
 * Job Management Endpoints
 */

// List jobs
router.get('/jobs', requireAuth, requireRecruiter, async (req: any, res, next) => {
  try {
    const userId = req.userId;
    const jobs = await prisma.job.findMany({
      where: { recruiterId: userId },
      include: {
        _count: {
          select: { applications: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json(jobs);
  } catch (err) {
    next(err);
  }
});

// Get job by ID
router.get('/jobs/:id', requireAuth, requireRecruiter, async (req: any, res, next) => {
  try {
    const userId = req.userId;
    const { id } = req.params;
    const job = await prisma.job.findFirst({
      where: { id, recruiterId: userId },
      include: {
        _count: {
          select: { applications: true }
        }
      }
    });
    if (!job) return res.status(404).json({ error: 'Job not found' });
    res.json(job);
  } catch (err) {
    next(err);
  }
});

// Create job
router.post('/jobs', requireAuth, requireRecruiter, async (req: any, res, next) => {
  try {
    const userId = req.userId;
    const { title, company, location, description, type, salaryRange } = req.body;
    
    const job = await prisma.job.create({
      data: {
        title,
        company,
        location,
        description,
        type: type || 'FULL_TIME',
        salaryRange,
        recruiterId: userId,
        status: 'OPEN'
      }
    });
    res.status(201).json(job);
  } catch (err) {
    next(err);
  }
});

// Update job
router.put('/jobs/:id', requireAuth, requireRecruiter, async (req: any, res, next) => {
  try {
    const userId = req.userId;
    const { id } = req.params;
    const { status, title, description } = req.body;

    const job = await prisma.job.update({
      where: { id, recruiterId: userId },
      data: { status, title, description }
    });
    res.json(job);
  } catch (err) {
    next(err);
  }
});

// Delete job
router.delete('/jobs/:id', requireAuth, requireRecruiter, async (req: any, res, next) => {
  try {
    const userId = req.userId;
    const { id } = req.params;
    await prisma.job.delete({
      where: { id, recruiterId: userId }
    });
    res.status(204).end();
  } catch (err) {
    next(err);
  }
});

// Get job applications
router.get('/jobs/:id/applications', requireAuth, requireRecruiter, async (req: any, res, next) => {
  try {
    const userId = req.userId;
    const { id } = req.params;
    
    const apps = await prisma.jobApplication.findMany({
      where: { jobId: id, job: { recruiterId: userId } },
      include: { candidate: true }
    });
    res.json(apps);
  } catch (err) {
    next(err);
  }
});

// Update application status
router.patch('/applications/:id', requireAuth, requireRecruiter, async (req: any, res, next) => {
  try {
    const userId = req.userId;
    const { id } = req.params;
    const { status, notes } = req.body;

    const app = await prisma.jobApplication.update({
      where: { id, job: { recruiterId: userId } },
      data: { status, notes }
    });
    res.json(app);
  } catch (err) {
    next(err);
  }
});

// ─── Multer for bulk resume uploads ─────────────────────────
const UPLOAD_DIR = 'uploads/recruiter';
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    const dir = path.join(UPLOAD_DIR);
    fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (_req, _file, cb) => {
    cb(null, `${uuidv4()}${path.extname(_file.originalname).toLowerCase()}`);
  },
});
const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
});

// ─── POST /jobs/:id/shortlist ────────────────────────────────
// Runs AI match pipeline against all PENDING applications for a job,
// computes matchScore, upserts JobApplication records, returns ranked list.
router.post('/jobs/:id/shortlist', requireAuth, requireRecruiter, async (req: any, res, next) => {
  try {
    const userId = req.userId;
    const { id: jobId } = req.params;
    const { matchThreshold = 0 } = req.body;

    // Verify job belongs to recruiter
    const job = await prisma.job.findFirst({ where: { id: jobId, recruiterId: userId } });
    if (!job) return res.status(404).json({ error: 'Job not found' });

    if (!job.description) {
      return res.status(400).json({ error: 'Job has no description. Set job description before shortlisting.' });
    }

    // Get all PENDING applications for this job
    const applications = await prisma.jobApplication.findMany({
      where: { jobId, status: 'PENDING' },
      include: { candidate: true },
    });

    if (applications.length === 0) {
      return res.json({ message: 'No pending candidates to shortlist', shortlisted: [] });
    }

    // Run match pipeline per candidate, collect results
    const results = await Promise.allSettled(
      applications.map(async (app: any) => {
        const result = await gapminerAgentApp.invoke({
          resumeText: app.candidate.resumeText,
          jobDescriptionText: job.description,
        });

        const matchPercentage = result.gapAnalysis?.matchPercentage ?? 0;

        const updated = await prisma.jobApplication.update({
          where: { id: app.id },
          data: {
            matchScore: matchPercentage,
            status: matchPercentage >= matchThreshold ? 'REVIEWING' : 'PENDING',
          },
        });

        return {
          applicationId: app.id,
          candidateId: app.candidate.id,
          candidateName: app.candidate.name,
          matchScore: matchPercentage,
          status: updated.status,
        };
      }),
    );

    // Separate successes from failures
    const shortlisted = results
      .filter((r): r is PromiseFulfilledResult<any> => r.status === 'fulfilled')
      .map((r) => r.value)
      .sort((a, b) => b.matchScore - a.matchScore);

    const failed = results
      .filter((r): r is PromiseRejectedResult => r.status === 'rejected')
      .map((_, i) => applications[i].id);

    return res.json({
      message: `Shortlisted ${shortlisted.length} candidates`,
      total: applications.length,
      shortlisted,
      failedCount: failed.length,
      failedApplicationIds: failed,
    });
  } catch (err) {
    next(err);
  }
});

// ─── POST /bulk-upload ──────────────────────────────────────
// Accepts multiple resume files + jobId, parses each resume,
// creates Candidate + JobApplication(PENDING) records.
// Does NOT run scoring — use /jobs/:id/shortlist after.
router.post('/bulk-upload', requireAuth, requireRecruiter, upload.array('resumes', 50), async (req: any, res, next) => {
  try {
    const userId = req.userId;
    const { jobId } = req.body;

    if (!jobId) return res.status(400).json({ error: 'jobId is required' });

    const job = await prisma.job.findFirst({ where: { id: jobId, recruiterId: userId } });
    if (!job) return res.status(404).json({ error: 'Job not found' });

    const files = req.files as Express.Multer.File[];
    if (!files || files.length === 0) {
      return res.status(400).json({ error: 'No resume files uploaded' });
    }

    const ALLOWED_TYPES = new Set([
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain',
    ]);

    const validFiles = files.filter((f) => ALLOWED_TYPES.has(f.mimetype));
    const skipped = files.length - validFiles.length;

    const results = await Promise.allSettled(
      validFiles.map(async (file) => {
        const buffer = fs.readFileSync(file.path);
        const resumeText = await parseDocument(buffer, file.mimetype);

        // Extract candidate name from parsed data if possible (optional enhancement)
        const candidate = await prisma.candidate.create({
          data: {
            name: file.originalname.replace(/\.[^.]+$/, ''), // use filename as provisional name
            email: null,
            resumeText,
            userId: null,
          },
        });

        const application = await prisma.jobApplication.upsert({
          where: { jobId_candidateId: { jobId, candidateId: candidate.id } },
          update: { status: 'PENDING' },
          create: {
            jobId,
            candidateId: candidate.id,
            status: 'PENDING',
            matchScore: null,
          },
        });

        // Clean up temp file
        fs.unlinkSync(file.path);

        return { candidateId: candidate.id, applicationId: application.id, filename: file.originalname };
      }),
    );

    const created = results
      .filter((r): r is PromiseFulfilledResult<any> => r.status === 'fulfilled')
      .map((r) => r.value);

    const failed = results
      .filter((r): r is PromiseRejectedResult => r.status === 'rejected')
      .map((r) => r.reason?.message || 'Unknown error');

    return res.status(201).json({
      message: `Uploaded ${created.length} resumes${skipped > 0 ? `, skipped ${skipped} unsupported files` : ''}`,
      candidates: created,
      failed,
    });
  } catch (err) {
    next(err);
  }
});

// ─── GET /jobs/:id/shortlist ────────────────────────────────
// Returns all applications for a job, sorted by matchScore descending.
router.get('/jobs/:id/shortlist', requireAuth, requireRecruiter, async (req: any, res, next) => {
  try {
    const userId = req.userId;
    const { id: jobId } = req.params;
    const { minScore, status } = req.query;

    const job = await prisma.job.findFirst({ where: { id: jobId, recruiterId: userId } });
    if (!job) return res.status(404).json({ error: 'Job not found' });

    const where: any = { jobId };
    if (status) where.status = status;
    if (minScore) where.matchScore = { gte: Number(minScore) };

    const applications = await prisma.jobApplication.findMany({
      where,
      include: { candidate: true },
      orderBy: { matchScore: 'desc' },
    });

    return res.json({
      jobId,
      jobTitle: job.title,
      total: applications.length,
      candidates: applications.map((app: any) => ({
        applicationId: app.id,
        candidateId: app.candidate.id,
        name: app.candidate.name,
        email: app.candidate.email,
        matchScore: app.matchScore,
        status: app.status,
        skills: app.candidate.skillsFound,
        parsedData: app.candidate.parsedData,
      })),
    });
  } catch (err) {
    next(err);
  }
});

// ─── POST /score ─────────────────────────────────────────────
// Score a single candidate against a job, upsert JobApplication.
router.post('/score', requireAuth, requireRecruiter, async (req: any, res, next) => {
  try {
    const userId = req.userId;
    const { candidateId, jobId } = req.body;

    if (!candidateId || !jobId) {
      return res.status(400).json({ error: 'candidateId and jobId are required' });
    }

    const [candidate, job] = await Promise.all([
      prisma.candidate.findUnique({ where: { id: candidateId } }),
      prisma.job.findFirst({ where: { id: jobId, recruiterId: userId } }),
    ]);

    if (!candidate) return res.status(404).json({ error: 'Candidate not found' });
    if (!job) return res.status(404).json({ error: 'Job not found' });
    if (!job.description) return res.status(400).json({ error: 'Job has no description' });

    const result = await gapminerAgentApp.invoke({
      resumeText: candidate.resumeText,
      jobDescriptionText: job.description,
    });

    const matchScore = result.gapAnalysis?.matchPercentage ?? 0;

    const application = await prisma.jobApplication.upsert({
      where: { jobId_candidateId: { jobId, candidateId } },
      update: { matchScore, status: matchScore >= 60 ? 'REVIEWING' : 'PENDING' },
      create: { jobId, candidateId, matchScore, status: matchScore >= 60 ? 'REVIEWING' : 'PENDING' },
    });

    return res.json({
      candidateId,
      jobId,
      matchScore,
      status: application.status,
      gapAnalysis: result.gapAnalysis,
    });
  } catch (err) {
    next(err);
  }
});

export default router;

