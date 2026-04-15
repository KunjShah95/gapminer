/**
 * AI Gateway — Model Registry & Preset Catalogue
 *
 * Defines well-known model IDs and ready-to-use ProviderConfig presets.
 * Consumers pick ONE preset (or craft their own) and pass it as `primary`
 * to the gateway. Fallback chains can be composed from these presets too.
 *
 * Usage:
 *   import { MODELS, defaultFallbackChain } from "./registry.js";
 *   const res = await getGateway().invoke({
 *     primary: MODELS.groq.llama3_70b,
 *     fallbacks: defaultFallbackChain,
 *     messages: [...]
 *   });
 */

import type { ProviderConfig } from "./types.js";

// ---------------------------------------------------------------------------
// Catalogue
// ---------------------------------------------------------------------------
export const MODELS = {
  // ── OpenAI ─────────────────────────────────────────────────────────────
  openai: {
    gpt4o: {
      provider: "openai" as const,
      model: "gpt-4o",
      temperature: 0,
    } satisfies ProviderConfig,

    gpt4o_mini: {
      provider: "openai" as const,
      model: "gpt-4o-mini",
      temperature: 0,
    } satisfies ProviderConfig,

    gpt4_turbo: {
      provider: "openai" as const,
      model: "gpt-4-turbo",
      temperature: 0,
    } satisfies ProviderConfig,

    o1_mini: {
      provider: "openai" as const,
      model: "o1-mini",
      temperature: 1, // o1 ignores temperature; set to 1 to avoid warnings
    } satisfies ProviderConfig,
  },

  // ── Anthropic (Claude) ──────────────────────────────────────────────────
  anthropic: {
    claude35_sonnet: {
      provider: "anthropic" as const,
      model: "claude-3-5-sonnet-20241022",
      temperature: 0,
      maxTokens: 8192,
    } satisfies ProviderConfig,

    claude35_haiku: {
      provider: "anthropic" as const,
      model: "claude-3-5-haiku-20241022",
      temperature: 0,
      maxTokens: 8192,
    } satisfies ProviderConfig,

    claude3_opus: {
      provider: "anthropic" as const,
      model: "claude-3-opus-20240229",
      temperature: 0,
      maxTokens: 4096,
    } satisfies ProviderConfig,
  },

  // ── Google Gemini ───────────────────────────────────────────────────────
  gemini: {
    gemini15_pro: {
      provider: "gemini" as const,
      model: "gemini-1.5-pro-latest",
      temperature: 0,
    } satisfies ProviderConfig,

    gemini15_flash: {
      provider: "gemini" as const,
      model: "gemini-1.5-flash-latest",
      temperature: 0,
    } satisfies ProviderConfig,

    gemini20_flash: {
      provider: "gemini" as const,
      model: "gemini-2.0-flash",
      temperature: 0,
    } satisfies ProviderConfig,
  },

  // ── Groq (Ultra-fast inference) ─────────────────────────────────────────
  groq: {
    llama3_70b: {
      provider: "groq" as const,
      model: "llama3-70b-8192",
      temperature: 0,
    } satisfies ProviderConfig,

    llama3_8b: {
      provider: "groq" as const,
      model: "llama3-8b-8192",
      temperature: 0,
    } satisfies ProviderConfig,

    mixtral_8x7b: {
      provider: "groq" as const,
      model: "mixtral-8x7b-32768",
      temperature: 0,
    } satisfies ProviderConfig,

    llama4_scout: {
      provider: "groq" as const,
      model: "meta-llama/llama-4-scout-17b-16e-instruct",
      temperature: 0,
    } satisfies ProviderConfig,
  },

  // ── Mistral ─────────────────────────────────────────────────────────────
  mistral: {
    large: {
      provider: "mistral" as const,
      model: "mistral-large-latest",
      temperature: 0,
    } satisfies ProviderConfig,

    small: {
      provider: "mistral" as const,
      model: "mistral-small-latest",
      temperature: 0,
    } satisfies ProviderConfig,

    codestral: {
      provider: "mistral" as const,
      model: "codestral-latest",
      temperature: 0,
    } satisfies ProviderConfig,
  },

  // ── OpenRouter ───────────────────────────────────────────────────────────
  openrouter: {
    /** Route to whichever model is cheapest/fastest right now */
    auto: {
      provider: "openrouter" as const,
      model: "openrouter/auto",
      temperature: 0,
    } satisfies ProviderConfig,

    deepseek_r1: {
      provider: "openrouter" as const,
      model: "deepseek/deepseek-r1",
      temperature: 0,
    } satisfies ProviderConfig,

    qwen_2_5_72b: {
      provider: "openrouter" as const,
      model: "qwen/qwen-2.5-72b-instruct",
      temperature: 0,
    } satisfies ProviderConfig,
  },

  // ── Ollama (local) ───────────────────────────────────────────────────────
  ollama: {
    /** Reads OLLAMA_MODEL from env, defaults to llama3.2:latest */
    default: (): ProviderConfig => ({
      provider: "ollama" as const,
      model: process.env.OLLAMA_MODEL ?? "llama3.2:latest",
      baseURL: process.env.OLLAMA_BASE_URL ?? "http://localhost:11434",
      temperature: 0,
    }),

    llama3: {
      provider: "ollama" as const,
      model: "llama3:latest",
      temperature: 0,
    } satisfies ProviderConfig,
  },
} as const;

// ---------------------------------------------------------------------------
// Pre-built fallback chains
// ---------------------------------------------------------------------------

/**
 * Default production fallback chain.
 * Fast + cheap first, powerful fallback, local last.
 *
 *   groq/llama3-70b  →  openai/gpt-4o-mini  →  ollama/local
 */
export const defaultFallbackChain: ProviderConfig[] = [
  MODELS.groq.llama3_70b,
  MODELS.openai.gpt4o_mini,
  MODELS.ollama.default(),
];

/**
 * High-quality chain — best models with cost fallback.
 *
 *   claude-3-5-sonnet  →  gpt-4o  →  gemini-1.5-pro
 */
export const highQualityFallbackChain: ProviderConfig[] = [
  MODELS.anthropic.claude35_sonnet,
  MODELS.openai.gpt4o,
  MODELS.gemini.gemini15_pro,
];

/**
 * Cost-optimised   — fast, cheap, open-weight models.
 *
 *   groq/llama3-8b  →  gemini-flash  →  mistral-small
 */
export const cheapFallbackChain: ProviderConfig[] = [
  MODELS.groq.llama3_8b,
  MODELS.gemini.gemini15_flash,
  MODELS.mistral.small,
];

// ---------------------------------------------------------------------------
// Helper: build a ProviderConfig from a simple string alias
// ---------------------------------------------------------------------------
export function modelFromAlias(alias: string): ProviderConfig {
  const map: Record<string, ProviderConfig> = {
    // short aliases
    "gpt-4o":               MODELS.openai.gpt4o,
    "gpt-4o-mini":          MODELS.openai.gpt4o_mini,
    "claude-sonnet":        MODELS.anthropic.claude35_sonnet,
    "claude-haiku":         MODELS.anthropic.claude35_haiku,
    "gemini-pro":           MODELS.gemini.gemini15_pro,
    "gemini-flash":         MODELS.gemini.gemini15_flash,
    "groq-llama3":          MODELS.groq.llama3_70b,
    "groq-llama3-fast":     MODELS.groq.llama3_8b,
    "mistral-large":        MODELS.mistral.large,
    "mistral-small":        MODELS.mistral.small,
    "openrouter-auto":      MODELS.openrouter.auto,
    "ollama":               MODELS.ollama.default(),
  };

  const found = map[alias];
  if (!found)
    throw new Error(
      `[gateway] Unknown model alias '${alias}'. ` +
        `Available: ${Object.keys(map).join(", ")}`,
    );
  return found;
}
