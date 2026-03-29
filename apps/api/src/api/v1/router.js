// Express core router for v1 API


import { Router } from 'express';
import authRouter from './endpoints/auth.js';
import resumeRouter from './endpoints/resume.js';
import jdRouter from './endpoints/jd.js';
import analysisRouter from './endpoints/analysis.js';
import roadmapRouter from './endpoints/roadmap.js';
import userRouter from './endpoints/user.js';
import feedbackRouter from './endpoints/feedback.js';
import agentRouter from './endpoints/agent.js';
import parseRouter from './endpoints/parse.js';
import negotiationRouter from './endpoints/negotiation.js';
import chatRouter from './endpoints/chat.js';
import scrapeRouter from './endpoints/scrape.js';

const router = Router();

router.use('/auth', authRouter);
router.use('/resume', resumeRouter);
router.use('/jd', jdRouter);
router.use('/analysis', analysisRouter);
router.use('/roadmap', roadmapRouter);
router.use('/user', userRouter);
router.use('/feedback', feedbackRouter);
router.use('/agent', agentRouter);
router.use('/parse', parseRouter);
router.use('/negotiation', negotiationRouter);
router.use('/chat', chatRouter);
router.use('/scrape', scrapeRouter);

export default router;
