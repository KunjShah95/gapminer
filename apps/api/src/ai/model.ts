/**
 * model.ts — Backwards-compatible `llm` export powered by AI Gateway.
 *
 * Existing agents can keep using:
 *   llm.invoke([...])
 *   llm.withStructuredOutput(schema).invoke([...])
 *
 * while the underlying provider can now be OpenAI, Anthropic, Gemini, Groq,
 * Mistral, OpenRouter, Ollama, or any OpenAI-compatible endpoint.
 */

import {
  getGateway,
  modelFromAlias,
  MODELS,
  defaultFallbackChain,
  highQualityFallbackChain,
  cheapFallbackChain,
} from "./gateway/index.js";
import type { ProviderConfig, GatewayMessage } from "./gateway/index.js";

/**
 * Resolve the active ProviderConfig from the env or fall back to gpt-4o-mini.
 */
function resolveActiveCfg(): ProviderConfig {
  const alias = process.env.AI_PRIMARY_MODEL;
  if (alias) {
    try {
      return modelFromAlias(alias);
    } catch (e: any) {
      console.warn(`[model] ${e.message} — falling back to gpt-4o-mini`);
    }
  }
  return MODELS.openai.gpt4o_mini;
}

function resolveFallbacks(primary: ProviderConfig): ProviderConfig[] {
  const chain = (process.env.AI_FALLBACK_CHAIN ?? "default").toLowerCase();
  const raw =
    chain === "highquality"
      ? highQualityFallbackChain
      : chain === "cheap"
        ? cheapFallbackChain
        : defaultFallbackChain;

  // Avoid retrying same provider/model pair as primary.
  return raw.filter(
    (f) => !(f.provider === primary.provider && f.model === primary.model),
  );
}

function normalizeMessages(input: any[]): GatewayMessage[] {
  if (!Array.isArray(input)) {
    return [{ role: "user", content: String(input ?? "") }];
  }

  return input.map((m) => {
    // LangChain message instances usually expose getType()
    if (m && typeof m.getType === "function") {
      const t = m.getType();
      const role: GatewayMessage["role"] =
        t === "system" ? "system" : t === "ai" ? "assistant" : "user";
      return {
        role,
        content: String(m.content ?? ""),
      };
    }

    // Plain role/content objects
    if (m && typeof m === "object" && "role" in m && "content" in m) {
      const role: GatewayMessage["role"] =
        m.role === "system"
          ? "system"
          : m.role === "assistant"
            ? "assistant"
            : "user";
      return {
        role,
        content: String(m.content ?? ""),
      };
    }

    // Tuple style: [role, content]
    if (Array.isArray(m) && m.length >= 2) {
      const role: GatewayMessage["role"] =
        m[0] === "system"
          ? "system"
          : m[0] === "assistant"
            ? "assistant"
            : "user";
      return {
        role,
        content: String(m[1] ?? ""),
      };
    }

    return { role: "user", content: String(m ?? "") };
  });
}

const cfg = resolveActiveCfg();
const fallbacks = resolveFallbacks(cfg);

/**
 * Legacy-compatible `llm` export.
 *
 * NOTE: For new code, prefer using `getGateway().invoke(...)` directly which
 * gives you caching, fallbacks, and structured output in one go.
 */
export const llm = {
  async invoke(messages: any[]) {
    const result = await getGateway().invoke({
      primary: cfg,
      fallbacks,
      messages: normalizeMessages(messages),
    });

    return {
      content: result.content,
      provider: result.resolvedProvider,
      model: result.resolvedModel,
      fromCache: result.fromCache,
      attempts: result.attempts,
    };
  },

  withStructuredOutput(schema: any) {
    return {
      invoke: async (messages: any[]) => {
        const result = await getGateway().invokeStructured(
          {
            primary: cfg,
            fallbacks,
            messages: normalizeMessages(messages),
          },
          schema,
        );
        return result.content;
      },
    };
  },
} as any;

export { resolveActiveCfg };
