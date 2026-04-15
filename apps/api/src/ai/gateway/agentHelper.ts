/**
 * AI Gateway — Agent Helper
 *
 * Provides a gateway-backed LangChain model that agents can use directly
 * with `.withStructuredOutput()`, `.invoke()`, etc.
 *
 * This wraps the gateway's provider selection and caching while still
 * returning a LangChain-compatible BaseChatModel interface.
 *
 * Usage in an agent:
 *
 *   import { getLlm } from "../gateway/agentHelper.js";
 *
 *   const model = await getLlm();
 *   const result = await model.withStructuredOutput(MySchema).invoke(messages);
 */

import { BaseChatModel } from "@langchain/core/language_models/chat_models";
import { buildModel, MODELS, modelFromAlias } from "./index.js";
import type { ProviderConfig } from "./index.js";

let _cachedModel: BaseChatModel | null = null;
let _cachedCfg: ProviderConfig | null = null;

/**
 * Returns a LangChain model instance for the currently configured primary provider.
 * The instance is cached for the process lifetime (re-created if config changes).
 *
 * @param overrideCfg - Optional: pass a specific config to bypass the env default
 */
export async function getLlm(overrideCfg?: ProviderConfig): Promise<BaseChatModel> {
  const cfg = overrideCfg ?? resolveDefault();

  // Return cached instance if config unchanged
  if (_cachedModel && _cachedCfg && areSameConfig(_cachedCfg, cfg)) {
    return _cachedModel;
  }

  const model = await buildModel(cfg);
  _cachedModel = model;
  _cachedCfg = cfg;
  return model;
}

function resolveDefault(): ProviderConfig {
  const alias = process.env.AI_PRIMARY_MODEL;
  if (alias) {
    try {
      return modelFromAlias(alias);
    } catch {
      // fall through
    }
  }
  return MODELS.openai.gpt4o_mini;
}

function areSameConfig(a: ProviderConfig, b: ProviderConfig): boolean {
  return a.provider === b.provider && a.model === b.model;
}

/** Invalidate the cached model (call when AI_PRIMARY_MODEL env changes at runtime) */
export function invalidateLlmCache(): void {
  _cachedModel = null;
  _cachedCfg = null;
}
