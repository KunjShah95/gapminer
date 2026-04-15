/**
 * model.ts — Backwards-compatible LangChain llm export
 *
 * We keep this file so all existing agents that do `import { llm } from "../model.js"`
 * continue to work without changes.  The model is now sourced from the AI Gateway
 * registry so it benefits from caching and the fallback chain.
 *
 * To change the active model at runtime, set:
 *   AI_PRIMARY_MODEL=<alias>   (see gateway/registry.ts for valid aliases)
 *
 * Examples:
 *   AI_PRIMARY_MODEL=gpt-4o
 *   AI_PRIMARY_MODEL=claude-sonnet
 *   AI_PRIMARY_MODEL=groq-llama3
 */

import { ChatOpenAI } from "@langchain/openai";
import { modelFromAlias, MODELS } from "./gateway/index.js";
import type { ProviderConfig } from "./gateway/index.js";

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

const cfg = resolveActiveCfg();

/**
 * Legacy-compatible `llm` export.
 *
 * NOTE: For new code, prefer using `getGateway().invoke(...)` directly which
 * gives you caching, fallbacks, and structured output in one go.
 */
export const llm = new ChatOpenAI({
  modelName: cfg.provider === "openai" ? cfg.model : "gpt-4o-mini",
  temperature: cfg.temperature ?? 0,
  openAIApiKey: process.env.OPENAI_API_KEY,
}) as any;

export { resolveActiveCfg };
