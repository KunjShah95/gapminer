import "dotenv/config";
import express from "express";
import cors from "cors";
import compression from "compression";
import helmet from "helmet";
import morgan from "morgan";
import { createServer } from "http";
import * as Sentry from "@sentry/node";
import rateLimit from "express-rate-limit";

import { config } from "./core/config.js";
import { initDb } from "./core/database.js";
import apiRouter from "./api/v1/router.js";
import gatewayRouter from "./api/gatewayRouter.js";
import { setupSwagger } from "./docs/swagger.js";
import { initWebSocketServer } from "./services/websocket.js";

// ─── Sentry Initialization ────────────────────────────────────
if (config.SENTRY_DSN) {
  Sentry.init({
    dsn: config.SENTRY_DSN,
    environment: config.DEBUG ? "development" : "production",
    tracesSampleRate: config.DEBUG ? 1.0 : 0.1,
  });
}

// ─── Rate Limiter ─────────────────────────────────────────────
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many requests, please try again later." },
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: {
    error: "Too many authentication attempts, please try again later.",
  },
});

const app = express();
const server = createServer(app);
setupSwagger(app);

// ─── Middleware ───────────────────────────────────────────────
app.use(helmet({ contentSecurityPolicy: false }));
app.use(compression({ threshold: 1000 }));
app.use(morgan(config.DEBUG ? "dev" : "combined"));
app.use(limiter);
app.use(
  cors({
    origin: config.CORS_ORIGINS,
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["*"],
  }),
);
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

// Serve uploaded files in dev
app.use("/uploads", express.static("uploads"));

// ─── Main health endpoint ───────────────────────────────────────
app.get("/health", async (_req, res) => {
  const health = {
    status: "ok",
    service: "gapminer-api",
    version: "1.0.0",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    checks: {},
  };

  try {
    const { PrismaClient } = await import("@prisma/client");
    const prisma = new PrismaClient();
    await prisma.$queryRaw`SELECT 1`;
    health.checks.database = "ok";
    await prisma.$disconnect();
  } catch {
    health.checks.database = "error";
    health.status = "degraded";
  }

  try {
    const { createClient } = await import("redis");
    const redis = createClient({ url: config.REDIS_URL });
    await redis.connect();
    await redis.ping();
    health.checks.redis = "ok";
    await redis.disconnect();
  } catch {
    health.checks.redis = "unavailable";
  }

  res.status(health.status === "ok" ? 200 : 503).json(health);
});

// ─── Liveness (K8s) - always returns ok if app is running ─────────
app.get("/health/liveness", (_req, res) => {
  res.json({ status: "ok", uptime: process.uptime() });
});

// ─── Readiness (K8s) - returns ok only if dependencies are available ─
app.get("/health/readiness", async (_req, res) => {
  let ready = true;
  const checks = {};

  try {
    const { PrismaClient } = await import("@prisma/client");
    const prisma = new PrismaClient();
    await prisma.$queryRaw`SELECT 1`;
    checks.database = "ok";
    await prisma.$disconnect();
  } catch {
    checks.database = "error";
    ready = false;
  }

  res.status(ready ? 200 : 503).json({ ready, checks });
});

// ─── API Routes ───────────────────────────────────────────────
app.use("/api/v1/auth", authLimiter);
app.use("/api/v1", apiRouter);
// ─── AI Gateway Routes ────────────────────────────────────────
app.use("/api/v1/ai/gateway", gatewayRouter);

// ─── 404 handler ─────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({ error: "Not found" });
});

// ─── Error handler ───────────────────────────────────────────
// eslint-disable-next-line no-unused-vars
app.use((err, _req, res, _next) => {
  Sentry.captureException(err);
  console.error(err);
  const status = err.status || err.statusCode || 500;
  res.status(status).json({ error: err.message || "Internal server error" });
});

// ─── Start ────────────────────────────────────────────────────
const PORT = config.PORT || 8000;

(async () => {
  await initDb();

  // Initialize WebSocket server
  initWebSocketServer(server);

  server.listen(PORT, () => {
    console.log(`🚀 GapMiner API running on http://localhost:${PORT}`);
    console.log(`📋 Health check: http://localhost:${PORT}/health`);
    console.log(`🔌 WebSocket server ready on ws://localhost:${PORT}`);
  });
})();

export default app;
