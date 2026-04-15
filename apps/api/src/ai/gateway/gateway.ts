/**
 * AI Gateway — Core Executor
 *
 * Provides:
 *  • Single-model invocation  (invoke)
 *  • Structured output        (invokeStructured)
 *  • Streaming                (stream)
 *  • Automatic fallback chain (tries primary, then each fallback in order)
 *  • Two-tier response cache  (LRU + Redis)
 *  • Detailed attempt logging for observability
 */

import {
  SystemMessage,
  HumanMessage,
  AIMessage,
} from "@langchain/core/messages";
import { BaseChatModel } from "@langchain/core/language_models/chat_models";
import { buildModel } from "./providers.js";
import { GatewayCache, buildCacheKey } from "./cache.js";
import type {
  GatewayRequest,
  GatewayResponse,
  GatewayMessage,
  ProviderConfig,
  ModelProvider,
} from "./types.js";

// ---------------------------------------------------------------------------
// Message helpers
// ---------------------------------------------------------------------------
function toLC(messages: GatewayMessage[]) {
  return messages.map((m) => {
    if (m.role === "system") return new SystemMessage(m.content);
    if (m.role === "assistant") return new AIMessage(m.content);
    return new HumanMessage(m.content);
  });
}

// ---------------------------------------------------------------------------
// Core gateway class
// ---------------------------------------------------------------------------
export class AIGateway {
  private cache: GatewayCache;

  constructor() {
    this.cache = GatewayCache.getInstance();
  }

  // ── Plain text invocation ─────────────────────────────────────────────────
  async invoke(req: GatewayRequest): Promise<GatewayResponse<string>> {
    return this._executeWithFallback(req, async (model, cfg) => {
      const response = await (model as any).invoke(toLC(req.messages));
      return typeof response.content === "string"
        ? response.content
        : JSON.stringify(response.content);
    });
  }

  // ── Structured output ──────────────────────────────────────────────────────
  async invokeStructured<T = unknown>(
    req: GatewayRequest,
    schema: Parameters<BaseChatModel["withStructuredOutput"]>[0],
  ): Promise<GatewayResponse<T>> {
    return this._executeWithFallback(req, async (model, _cfg) => {
      const structured = (model as any).withStructuredOutput(schema);
      return structured.invoke(toLC(req.messages)) as Promise<T>;
    }) as Promise<GatewayResponse<T>>;
  }

  // ── Streaming ──────────────────────────────────────────────────────────────
  async *stream(req: GatewayRequest): AsyncGenerator<string> {
    const chain = [req.primary, ...(req.fallbacks ?? [])];
    let lastErr: Error | null = null;

    for (const cfg of chain) {
      try {
        const model = await buildModel(cfg);
        const stream = await (model as any).stream(toLC(req.messages));
        for await (const chunk of stream) {
          yield typeof chunk.content === "string"
            ? chunk.content
            : JSON.stringify(chunk.content);
        }
        return; // success
      } catch (err: any) {
        console.warn(
          `[gateway:stream] ${cfg.provider}/${cfg.model} failed:`,
          err?.message,
        );
        lastErr = err;
      }
    }
    throw lastErr ?? new Error("[gateway:stream] All providers failed");
  }

  // ── Cache management ───────────────────────────────────────────────────────
  async deleteCache(key: string): Promise<void> {
    await this.cache.delete(key);
  }

  async flushCache(): Promise<void> {
    await this.cache.flush();
  }

  get cacheStats() {
    return this.cache.stats;
  }

  // ── Private: fallback executor ────────────────────────────────────────────
  private async _executeWithFallback<T>(
    req: GatewayRequest,
    fn: (model: BaseChatModel, cfg: ProviderConfig) => Promise<T>,
  ): Promise<GatewayResponse<T>> {
    const chain: ProviderConfig[] = [req.primary, ...(req.fallbacks ?? [])];
    const attempts: GatewayResponse<T>["attempts"] = [];

    // ── Cache lookup ────────────────────────────────────────────────────────
    const cacheKey =
      req.cacheKey !== null
        ? (req.cacheKey ??
          buildCacheKey(
            req.messages,
            req.primary.provider,
            req.primary.model,
            req.primary.temperature ?? 0,
          ))
        : null;

    if (cacheKey) {
      const hit = await this.cache.get(cacheKey);
      if (hit !== null) {
        let parsed: T;
        try {
          parsed = JSON.parse(hit) as T;
        } catch {
          parsed = hit as unknown as T;
        }
        return {
          content: parsed,
          resolvedProvider: req.primary.provider,
          resolvedModel: req.primary.model,
          fromCache: true,
          latencyMs: 0,
          attempts: [],
        };
      }
    }

    // ── Fallback chain ──────────────────────────────────────────────────────
    let lastError: Error | null = null;

    for (const cfg of chain) {
      const t0 = Date.now();
      try {
        const model = await buildModel(cfg);
        const content = await fn(model, cfg);
        const latencyMs = Date.now() - t0;

        // ── Persist to cache ──────────────────────────────────────────────
        if (cacheKey) {
          const serialised =
            typeof content === "string"
              ? content
              : JSON.stringify(content);
          await this.cache.set(
            cacheKey,
            serialised,
            req.cacheTtlSeconds ?? 3600,
          );
        }

        attempts.push({ provider: cfg.provider, model: cfg.model });

        return {
          content,
          resolvedProvider: cfg.provider,
          resolvedModel: cfg.model,
          fromCache: false,
          latencyMs,
          attempts,
        };
      } catch (err: any) {
        const msg = err?.message ?? String(err);
        console.warn(
          `[gateway] ${cfg.provider}/${cfg.model} failed (${Date.now() - t0} ms): ${msg}`,
        );
        attempts.push({ provider: cfg.provider, model: cfg.model, error: msg });
        lastError = err;
      }
    }

    throw Object.assign(
      new Error(`[gateway] All ${chain.length} providers failed`),
      { attempts, cause: lastError },
    );
  }
}

// ---------------------------------------------------------------------------
// Singleton — share one instance across the process
// ---------------------------------------------------------------------------
let _gateway: AIGateway | null = null;

export function getGateway(): AIGateway {
  if (!_gateway) _gateway = new AIGateway();
  return _gateway;
}
