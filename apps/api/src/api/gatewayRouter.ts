/**
 * AI Gateway — Express Router
 *
 * Exposes runtime management and model-selection endpoints:
 *
 *   GET  /ai/gateway/models          → list all available model presets
 *   GET  /ai/gateway/status          → cache stats + active model
 *   POST /ai/gateway/invoke          → single-shot text completion
 *   POST /ai/gateway/invoke/structured → structured output completion
 *   GET  /ai/gateway/stream          → SSE streaming completion
 *   DELETE /ai/gateway/cache         → flush the entire cache
 *   DELETE /ai/gateway/cache/:key    → evict a specific cache key
 */

import { Router, Request, Response } from "express";
import {
  getGateway,
  MODELS,
  modelFromAlias,
  defaultFallbackChain,
  highQualityFallbackChain,
  cheapFallbackChain,
} from "../ai/gateway/index.js";
import type { GatewayRequest, GatewayMessage, ProviderConfig } from "../ai/gateway/index.js";

const router = Router();

// ── Helper ────────────────────────────────────────────────────────────────
function parseMessages(raw: unknown): GatewayMessage[] {
  if (!Array.isArray(raw)) throw new Error("'messages' must be an array");
  return raw.map((m: any, i: number) => {
    if (!m.role || !m.content)
      throw new Error(`messages[${i}] must have 'role' and 'content'`);
    if (!["system", "user", "assistant"].includes(m.role))
      throw new Error(`messages[${i}].role must be system | user | assistant`);
    return { role: m.role, content: String(m.content) } as GatewayMessage;
  });
}

function parsePrimaryConfig(body: any): ProviderConfig {
  if (body.modelAlias) return modelFromAlias(body.modelAlias);

  if (!body.provider || !body.model)
    throw new Error("Provide 'modelAlias' OR both 'provider' + 'model'");

  return {
    provider: body.provider,
    model: body.model,
    temperature: body.temperature ?? 0,
    maxTokens: body.maxTokens,
    baseURL: body.baseURL,
    apiKey: body.apiKey,
    extraHeaders: body.extraHeaders,
  } as ProviderConfig;
}

function parseFallbacks(body: any): ProviderConfig[] | undefined {
  const key = body.fallbackChain;
  if (key === "default") return defaultFallbackChain;
  if (key === "highQuality") return highQualityFallbackChain;
  if (key === "cheap") return cheapFallbackChain;
  if (Array.isArray(body.fallbacks)) return body.fallbacks as ProviderConfig[];
  return undefined;
}

// ── Routes ────────────────────────────────────────────────────────────────

/**
 * @openapi
 * /ai/gateway/models:
 *   get:
 *     summary: List all available model presets
 */
router.get("/models", (_req: Request, res: Response) => {
  const catalogue: Record<string, string[]> = {};
  for (const [provider, models] of Object.entries(MODELS)) {
    catalogue[provider] = Object.keys(models);
  }
  res.json({
    success: true,
    catalogue,
    fallbackChains: ["default", "highQuality", "cheap"],
    activeModel: process.env.AI_PRIMARY_MODEL ?? "gpt-4o-mini (default)",
  });
});

/**
 * @openapi
 * /ai/gateway/status:
 *   get:
 *     summary: Gateway health + cache stats
 */
router.get("/status", (_req: Request, res: Response) => {
  const gw = getGateway();
  res.json({
    success: true,
    activeModel: process.env.AI_PRIMARY_MODEL ?? "gpt-4o-mini",
    cache: gw.cacheStats,
    uptime: process.uptime(),
  });
});

/**
 * @openapi
 * /ai/gateway/invoke:
 *   post:
 *     summary: Plain text completion with optional fallback chain
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               modelAlias: { type: string }
 *               provider:   { type: string }
 *               model:      { type: string }
 *               messages:   { type: array }
 *               cacheKey:   { type: string }
 *               cacheTtlSeconds: { type: number }
 *               fallbackChain: { type: string, enum: [default, highQuality, cheap] }
 */
router.post("/invoke", async (req: Request, res: Response) => {
  try {
    const primary = parsePrimaryConfig(req.body);
    const messages = parseMessages(req.body.messages);
    const fallbacks = parseFallbacks(req.body);

    const gwReq: GatewayRequest = {
      primary,
      fallbacks,
      messages,
      cacheKey: req.body.cacheKey ?? undefined,
      cacheTtlSeconds: req.body.cacheTtlSeconds,
    };

    const result = await getGateway().invoke(gwReq);
    res.json({ success: true, ...result });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message, attempts: err.attempts });
  }
});

/**
 * @openapi
 * /ai/gateway/invoke/structured:
 *   post:
 *     summary: Typed structured output completion
 */
router.post("/invoke/structured", async (req: Request, res: Response) => {
  try {
    const primary = parsePrimaryConfig(req.body);
    const messages = parseMessages(req.body.messages);
    const fallbacks = parseFallbacks(req.body);
    const schema = req.body.schema;

    if (!schema) throw new Error("'schema' (JSON Schema object) is required");

    const gwReq: GatewayRequest = {
      primary,
      fallbacks,
      messages,
      schema,
      cacheKey: req.body.cacheKey ?? undefined,
      cacheTtlSeconds: req.body.cacheTtlSeconds,
    };

    const result = await getGateway().invokeStructured(gwReq, schema);
    res.json({ success: true, ...result });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * @openapi
 * /ai/gateway/stream:
 *   post:
 *     summary: SSE streaming completion
 */
router.post("/stream", async (req: Request, res: Response) => {
  try {
    const primary = parsePrimaryConfig(req.body);
    const messages = parseMessages(req.body.messages);
    const fallbacks = parseFallbacks(req.body);

    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.flushHeaders();

    const gwReq: GatewayRequest = { primary, fallbacks, messages, cacheKey: null };

    for await (const chunk of getGateway().stream(gwReq)) {
      res.write(`data: ${JSON.stringify({ chunk })}\n\n`);
    }
    res.write("data: [DONE]\n\n");
    res.end();
  } catch (err: any) {
    res.write(`data: ${JSON.stringify({ error: err.message })}\n\n`);
    res.end();
  }
});

/**
 * @openapi
 * /ai/gateway/cache:
 *   delete:
 *     summary: Flush the entire AI response cache
 */
router.delete("/cache", async (_req: Request, res: Response) => {
  try {
    await getGateway().flushCache();
    res.json({ success: true, message: "Cache flushed" });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * @openapi
 * /ai/gateway/cache/{key}:
 *   delete:
 *     summary: Evict a specific cache key
 */
router.delete("/cache/:key", async (req: Request, res: Response) => {
  try {
    const key = req.params.key as string;
    await getGateway().deleteCache(key);
    res.json({ success: true, message: `Cache key '${key}' evicted` });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
