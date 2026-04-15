/**
 * AI Gateway — Cache Layer
 *
 * Two-tier caching:
 *  1. In-process LRU (fast; survives Redis outages)
 *  2. Redis (shared across instances; persistent)
 *
 * If Redis is unavailable, the gateway gracefully falls back to the in-process
 * cache and logs a warning — it never blocks a request.
 */

import { createClient, RedisClientType } from "redis";

const DEFAULT_TTL = 3600; // 1 hour
const LRU_MAX_SIZE = 500; // max items kept in process memory

interface LruEntry {
  value: string;
  expiresAt: number; // Unix ms
}

// ---------------------------------------------------------------------------
// Simple synchronous LRU map (avoids a heavy external dep)
// ---------------------------------------------------------------------------
class LruCache {
  private map = new Map<string, LruEntry>();

  constructor(private maxSize: number) {}

  get(key: string): string | null {
    const entry = this.map.get(key);
    if (!entry) return null;
    if (Date.now() > entry.expiresAt) {
      this.map.delete(key);
      return null;
    }
    // Move to end (most-recently-used)
    this.map.delete(key);
    this.map.set(key, entry);
    return entry.value;
  }

  set(key: string, value: string, ttlSeconds: number): void {
    if (this.map.size >= this.maxSize) {
      // Evict oldest
      const oldestKey = this.map.keys().next().value;
      if (oldestKey) this.map.delete(oldestKey);
    }
    this.map.set(key, { value, expiresAt: Date.now() + ttlSeconds * 1000 });
  }

  delete(key: string): void {
    this.map.delete(key);
  }

  clear(): void {
    this.map.clear();
  }

  get size(): number {
    return this.map.size;
  }
}

// ---------------------------------------------------------------------------
// Gateway Cache (singleton)
// ---------------------------------------------------------------------------
export class GatewayCache {
  private lru: LruCache;
  private redis: RedisClientType | null = null;
  private redisReady = false;
  private namespace: string;

  /** Global singleton — call `GatewayCache.getInstance()` */
  private static instance: GatewayCache | null = null;

  private constructor(namespace = "ai-gw") {
    this.namespace = namespace;
    this.lru = new LruCache(LRU_MAX_SIZE);
    this.initRedis();
  }

  static getInstance(): GatewayCache {
    if (!GatewayCache.instance) {
      GatewayCache.instance = new GatewayCache(
        process.env.AI_CACHE_NAMESPACE ?? "ai-gw",
      );
    }
    return GatewayCache.instance;
  }

  // -------------------------------------------------------------------------
  // Public API
  // -------------------------------------------------------------------------

  async get(key: string): Promise<string | null> {
    const prefixedKey = this.prefix(key);

    // 1) In-process LRU first
    const lruHit = this.lru.get(prefixedKey);
    if (lruHit !== null) return lruHit;

    // 2) Redis
    if (this.redisReady && this.redis) {
      try {
        const rHit = await this.redis.get(prefixedKey);
        if (rHit !== null) {
          // Warm the LRU so the next call is instant
          this.lru.set(prefixedKey, rHit, DEFAULT_TTL);
          return rHit;
        }
      } catch (err) {
        console.warn("[ai-cache] Redis GET failed — using LRU only:", err);
      }
    }

    return null;
  }

  async set(key: string, value: string, ttlSeconds = DEFAULT_TTL): Promise<void> {
    const prefixedKey = this.prefix(key);

    // Always write to LRU
    this.lru.set(prefixedKey, value, ttlSeconds);

    // Best-effort Redis write
    if (this.redisReady && this.redis) {
      try {
        await this.redis.setEx(prefixedKey, ttlSeconds, value);
      } catch (err) {
        console.warn("[ai-cache] Redis SET failed — cached in LRU only:", err);
      }
    }
  }

  async delete(key: string): Promise<void> {
    const prefixedKey = this.prefix(key);
    this.lru.delete(prefixedKey);
    if (this.redisReady && this.redis) {
      try {
        await this.redis.del(prefixedKey);
      } catch {
        // non-critical
      }
    }
  }

  async flush(): Promise<void> {
    this.lru.clear();
    // We only flush keys under our namespace, not all of Redis
    if (this.redisReady && this.redis) {
      try {
        const keys = await this.redis.keys(`${this.namespace}:*`);
        if (keys.length > 0) await this.redis.del(keys);
      } catch {
        // non-critical
      }
    }
  }

  get stats() {
    return {
      lruSize: this.lru.size,
      redisConnected: this.redisReady,
    };
  }

  // -------------------------------------------------------------------------
  // Helpers
  // -------------------------------------------------------------------------

  private prefix(key: string): string {
    return `${this.namespace}:${key}`;
  }

  private async initRedis(): Promise<void> {
    const redisUrl = process.env.REDIS_URL;
    if (!redisUrl) {
      console.info("[ai-cache] REDIS_URL not set — using in-process LRU only");
      return;
    }

    try {
      this.redis = createClient({ url: redisUrl }) as RedisClientType;
      this.redis.on("error", (err: Error) => {
        console.warn("[ai-cache] Redis error:", err.message);
        this.redisReady = false;
      });
      this.redis.on("ready", () => {
        console.info("[ai-cache] Redis connected");
        this.redisReady = true;
      });
      await this.redis.connect();
    } catch (err) {
      console.warn("[ai-cache] Could not connect to Redis:", err);
      this.redis = null;
    }
  }
}

// ---------------------------------------------------------------------------
// Cache key builder
// Produces a deterministic hash from a request's messages + model config.
// ---------------------------------------------------------------------------
import { createHash } from "crypto";

export function buildCacheKey(
  messages: Array<{ role: string; content: string }>,
  provider: string,
  model: string,
  temperature: number,
): string {
  const payload = JSON.stringify({ messages, provider, model, temperature });
  return createHash("sha256").update(payload).digest("hex").slice(0, 32);
}
