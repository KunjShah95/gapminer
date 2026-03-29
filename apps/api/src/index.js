import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import compression from 'compression';
import helmet from 'helmet';
import morgan from 'morgan';
import * as Sentry from '@sentry/node';

import { config } from './core/config.js';
import { initDb } from './core/database.js';
import apiRouter from './api/v1/router.js';
import { setupSwagger } from './docs/swagger.js';

// ... (Sentry init etc)

const app = express();
setupSwagger(app);

// ─── Middleware ───────────────────────────────────────────────
app.use(helmet({ contentSecurityPolicy: false }));
app.use(compression({ threshold: 1000 }));
app.use(morgan(config.DEBUG ? 'dev' : 'combined'));
app.use(
  cors({
    origin: config.CORS_ORIGINS,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['*'],
  })
);
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Serve uploaded files in dev
app.use('/uploads', express.static('uploads'));

// ─── Health ───────────────────────────────────────────────────
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'gapminer-api', version: '1.0.0' });
});

// ─── API Routes ───────────────────────────────────────────────
app.use('/api/v1', apiRouter);

// ─── 404 handler ─────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// ─── Error handler ───────────────────────────────────────────
// eslint-disable-next-line no-unused-vars
app.use((err, _req, res, _next) => {
  console.error(err);
  const status = err.status || err.statusCode || 500;
  res.status(status).json({ error: err.message || 'Internal server error' });
});

// ─── Start ────────────────────────────────────────────────────
const PORT = config.PORT || 8000;
(async () => {
  await initDb();
  app.listen(PORT, () => {
    console.log(`🚀 GapMiner API running on http://localhost:${PORT}`);
    console.log(`📋 Health check: http://localhost:${PORT}/health`);
  });
})();

export default app;
