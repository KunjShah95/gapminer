import { Router } from 'express';
import { prisma } from '../../../core/database.js';
import { requireAuth } from '../../../core/security.js';
import {
  generateNegotiationStrategy,
  analyzeOffer,
  lookupSalaryBenchmarks,
  getCompanyIntelligence,
  getSalaryDataForRole,
} from '../../../ai/negotiationAgent.js';

const router = Router();

/**
 * @openapi
 * /api/v1/negotiation/strategy:
 *   post:
 *     summary: Generate a negotiation strategy based on offer details
 *     tags: [Negotiation]
 *     security:
 *       - bearerAuth: []
 */
router.post('/strategy', requireAuth, async (req, res, next) => {
  try {
    const userId = (req as any).userId;
    const {
      roleTitle,
      location,
      yearsExperience,
      currentOffer,
      competingOffers,
      companyName,
    } = req.body;

    if (!roleTitle || !location || !yearsExperience) {
      return res.status(400).json({ error: 'Missing required fields: roleTitle, location, yearsExperience' });
    }

    const result = await generateNegotiationStrategy(
      roleTitle,
      location,
      yearsExperience,
      currentOffer,
      competingOffers || [],
      companyName
    );

    const session = await prisma.negotiationSession.create({
      data: {
        userId,
        targetRole: roleTitle,
        targetCompany: companyName,
        location,
        currentOffer,
        competingOffers,
        salaryBenchmark: result.benchmarkData,
        negotiationPlan: result.strategy,
      }
    });

    return res.json({
      sessionId: session.id,
      benchmarks: result.benchmarkData,
      companyIntel: result.companyIntel,
      strategy: result.strategy,
    });
  } catch (err) {
    next(err);
  }
});

/**
 * @openapi
 * /api/v1/negotiation/analyze-offer:
 *   post:
 *     summary: Analyze a specific offer against market data
 *     tags: [Negotiation]
 *     security:
 *       - bearerAuth: []
 */
router.post('/analyze-offer', requireAuth, async (req, res, next) => {
  try {
    const {
      offerDetails,
      roleTitle,
      location,
      yearsExperience,
    } = req.body;

    if (!offerDetails || !roleTitle || !location || !yearsExperience) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const result = await analyzeOffer(
      offerDetails,
      roleTitle,
      location,
      yearsExperience
    );

    return res.json(result);
  } catch (err) {
    next(err);
  }
});

/**
 * @openapi
 * /api/v1/negotiation/benchmarks:
 *   get:
 *     summary: Get salary benchmarks for a role/location
 *     tags: [Negotiation]
 *     security:
 *       - bearerAuth: []
 */
router.get('/benchmarks', requireAuth, async (req, res, next) => {
  try {
    const { role, location, experience } = req.query;

    if (!role || !location || !experience) {
      return res.status(400).json({ error: 'Missing query params: role, location, experience' });
    }

    const benchmarks = await getSalaryDataForRole(
      role as string,
      location as string,
      parseInt(experience as string)
    );

    return res.json({ benchmarks });
  } catch (err) {
    next(err);
  }
});

/**
 * @openapi
 * /api/v1/negotiation/company/{name}:
 *   get:
 *     summary: Get company intelligence for negotiation
 *     tags: [Negotiation]
 *     security:
 *       - bearerAuth: []
 */
router.get('/company/:name', requireAuth, async (req, res, next) => {
  try {
    const { name } = req.params;
    const company = await getCompanyIntelligence(name);

    if (!company) {
      return res.json({
        message: 'Company not in database - using general negotiation tactics',
        companyTier: 'mid',
        negotiationStyle: 'data-driven',
      });
    }

    return res.json(company);
  } catch (err) {
    next(err);
  }
});

/**
 * @openapi
 * /api/v1/negotiation/sessions:
 *   get:
 *     summary: Get user's negotiation sessions
 *     tags: [Negotiation]
 *     security:
 *       - bearerAuth: []
 */
router.get('/sessions', requireAuth, async (req, res, next) => {
  try {
    const userId = (req as any).userId;
    
    const sessions = await prisma.negotiationSession.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });

    return res.json({ sessions });
  } catch (err) {
    next(err);
  }
});

/**
 * @openapi
 * /api/v1/negotiation/sessions/{id}:
 *   patch:
 *     summary: Update negotiation session with outcome
 *     tags: [Negotiation]
 *     security:
 *       - bearerAuth: []
 */
router.patch('/sessions/:id', requireAuth, async (req, res, next) => {
  try {
    const { id } = req.params;
    const { outcome, finalComp } = req.body;

    const session = await prisma.negotiationSession.update({
      where: { id },
      data: {
        outcome,
        finalComp,
      }
    });

    return res.json(session);
  } catch (err) {
    next(err);
  }
});

export default router;
