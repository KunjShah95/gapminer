import { createClient } from "redis";
import { config } from "../core/config.js";

const CACHE_TTL = 6 * 60 * 60; // 6 hours
const LRU_MAX = 200;

class LruMap {
  constructor(maxSize) {
    this.maxSize = maxSize;
    this.map = new Map();
  }
  get(key) {
    const entry = this.map.get(key);
    if (!entry) return null;
    if (Date.now() > entry.expiresAt) {
      this.map.delete(key);
      return null;
    }
    this.map.delete(key);
    this.map.set(key, entry);
    return entry.value;
  }
  set(key, value, ttlSeconds) {
    if (this.map.size >= this.maxSize) {
      const oldest = this.map.keys().next().value;
      if (oldest) this.map.delete(oldest);
    }
    this.map.set(key, { value, expiresAt: Date.now() + ttlSeconds * 1000 });
  }
  delete(key) {
    this.map.delete(key);
  }
  clear() {
    this.map.clear();
  }
}

let redisClient = null;
let redisReady = false;
const lru = new LruMap(LRU_MAX);

async function initRedis() {
  if (!config.REDIS_URL) return;
  try {
    redisClient = createClient({ url: config.REDIS_URL });
    redisClient.on("error", () => { redisReady = false; });
    redisClient.on("ready", () => { redisReady = true; });
    await redisClient.connect();
  } catch {
    redisClient = null;
  }
}

initRedis();

export async function getCache(key) {
  const lruHit = lru.get(key);
  if (lruHit) return JSON.parse(lruHit);

  if (redisReady && redisClient) {
    try {
      const hit = await redisClient.get(`market:${key}`);
      if (hit) {
        lru.set(key, hit, CACHE_TTL);
        return JSON.parse(hit);
      }
    } catch { /* ignore */ }
  }
  return null;
}

export async function setCache(key, value, ttl = CACHE_TTL) {
  const str = JSON.stringify(value);
  lru.set(key, str, ttl);
  if (redisReady && redisClient) {
    try {
      await redisClient.setEx(`market:${key}`, ttl, str);
    } catch { /* best-effort */ }
  }
}

export async function clearCache(pattern) {
  lru.clear();
  if (redisReady && redisClient) {
    try {
      const keys = await redisClient.keys(`market:${pattern || "*"}`);
      if (keys.length > 0) await redisClient.del(keys);
    } catch { /* ignore */ }
  }
}
