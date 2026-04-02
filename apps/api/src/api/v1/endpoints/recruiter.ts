import { Router } from 'express';
import { prisma } from '../../../core/database.js';
import { requireAuth } from '../../../core/security.js';

const router = Router();

/**
 * @openapi
 * /api/v1/recruiter/stats:
 *   get:
 *     summary: Get dashboard statistics for recruiter
 *     tags: [Recruiter]
 *     security:
 *       - bearerAuth: []
 */
router.get('/stats', requireAuth, async (req, res, next) => {
  try {
    // In a real app, we'd filter by recruiter/organization
    // For now, returning global mock-like stats from DB
    const totalCandidates = await prisma.candidate.count();
    
    // Mocking some recruiter-specific stats not in current schema
    // In production, we'd have a 'Job' model
    return res.json({
      activeJobs: 12,
      totalCandidates,
      shortlisted: Math.floor(totalCandidates * 0.3),
      interviewsScheduled: 8,
      avgMatchScore: 78.5,
      hiringVelocity: '14 days'
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
router.get('/candidates', requireAuth, async (req, res, next) => {
  try {
    const candidates = await prisma.candidate.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: {
            name: true,
            email: true,
            avatar: true
          }
        }
      }
    });

    const formattedCandidates = candidates.map((c: any) => ({
      id: c.id,
      name: c.name || c.user?.name || 'Unknown Candidate',
      role: 'Software Engineer', // Placeholder until we have Job models
      matchScore: Math.floor(Math.random() * 40) + 60, // Mock score for now
      status: ['Sourced', 'Interview', 'Offer', 'Hired'][Math.floor(Math.random() * 4)],
      lastActive: c.updatedAt,
      skills: (c.skillsFound || []).slice(0, 3)
    }));

    return res.json(formattedCandidates);
  } catch (err) {
    next(err);
  }
});

export default router;
