// Feedback endpoint — stub to match python router
import { Router } from 'express';

const router = Router();

// Feedback is handled in analysis.js (POST /analysis/:id/feedback),
// but we provide the router to match the Python structure.

export default router;
