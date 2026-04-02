import { Router } from 'express';
import { prisma } from '../../../core/database.js';
import { requireAuth } from '../../../core/security.js';

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
      hiringVelocity: '12 days' // Mocked field for now
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

export default router;

