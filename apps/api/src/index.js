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

// ─── Health ───────────────────────────────────────────────────
app.get("/health", (_req, res) => {
  res.json({ status: "ok", service: "gapminer-api", version: "1.0.0" });
});

// ─── API Routes ───────────────────────────────────────────────
app.use("/api/v1/auth", authLimiter);
app.use("/api/v1", apiRouter);

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
