/**
 * AI Gateway — Types & Interfaces
 * Supports: OpenAI, Anthropic (Claude), Gemini, Groq, Mistral, OpenRouter,
 *           and any OpenAI-compatible endpoint.
 */

export type ModelProvider =
  | "openai"
  | "anthropic"
  | "gemini"
  | "groq"
  | "mistral"
  | "openrouter"
  | "ollama"
  | "openai-compatible";

export interface ProviderConfig {
  provider: ModelProvider;
  /** The model ID as expected by the provider (e.g. "gpt-4o", "claude-3-5-sonnet-20241022") */
  model: string;
  /** Override the provider's default base URL (required for "openai-compatible") */
  baseURL?: string;
  /** API key; falls back to the relevant env var if omitted */
  apiKey?: string;
  /** Max tokens to generate */
  maxTokens?: number;
  /** 0–2; defaults to 0 */
  temperature?: number;
  /** Extra headers forwarded to the underlying HTTP call */
  extraHeaders?: Record<string, string>;
}

export interface GatewayRequest {
  /** Primary model configuration */
  primary: ProviderConfig;
  /**
   * Ordered fallback chain. The gateway tries each in sequence when the
   * primary (or a preceding fallback) throws.
   */
  fallbacks?: ProviderConfig[];
  messages: GatewayMessage[];
  /** JSON-schema / Zod-inferred schema for structured output */
  schema?: Record<string, unknown>;
  /** Unique key for caching. Pass null to bypass cache. */
  cacheKey?: string | null;
  /** How many seconds to keep the cached response. Default: 3600 (1 h) */
  cacheTtlSeconds?: number;
  /** If true, stream the raw text instead of returning the full message */
  stream?: boolean;
}

export interface GatewayMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface GatewayResponse<T = string> {
  content: T;
  /** Which provider/model actually produced the response */
  resolvedProvider: ModelProvider;
  resolvedModel: string;
  /** true if the response was served from cache */
  fromCache: boolean;
  /** Latency in ms (0 when served from cache) */
  latencyMs: number;
  /** Which attempts were made before a successful response */
  attempts: Array<{ provider: ModelProvider; model: string; error?: string }>;
}

export interface CacheOptions {
  /** Redis / in-memory TTL in seconds */
  ttl: number;
  /** Optional namespace prefix for all keys */
  namespace?: string;
}
