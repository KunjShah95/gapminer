/**
 * AI Gateway — Provider Adapters
 *
 * Each adapter normalises a provider's SDK into a single interface:
 *   invoke(messages, config) → string
 *
 * All providers ultimately share the LangChain `BaseChatModel` interface so
 * that `.withStructuredOutput()` and streaming "just work" downstream.
 */

import { BaseChatModel } from "@langchain/core/language_models/chat_models";
import { ChatOpenAI } from "@langchain/openai";
import type { ProviderConfig } from "./types.js";

// We lazy-import optional providers so a missing API key doesn't crash startup.
// The adapters are thin wrappers that return a BaseChatModel instance.

// ---------------------------------------------------------------------------
// OpenAI
// ---------------------------------------------------------------------------
function buildOpenAI(cfg: ProviderConfig): BaseChatModel {
  const apiKey = cfg.apiKey ?? process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("[gateway] OPENAI_API_KEY is not set");

  return new ChatOpenAI({
    modelName: cfg.model,
    temperature: cfg.temperature ?? 0,
    maxTokens: cfg.maxTokens,
    openAIApiKey: apiKey,
  }) as unknown as BaseChatModel;
}

// ---------------------------------------------------------------------------
// Anthropic (Claude)
// ---------------------------------------------------------------------------
async function buildAnthropic(cfg: ProviderConfig): Promise<BaseChatModel> {
  try {
    const { ChatAnthropic } = await import("@langchain/anthropic");
    const apiKey = cfg.apiKey ?? process.env.ANTHROPIC_API_KEY;
    if (!apiKey) throw new Error("[gateway] ANTHROPIC_API_KEY is not set");

    return new ChatAnthropic({
      model: cfg.model,
      temperature: cfg.temperature ?? 0,
      maxTokens: cfg.maxTokens ?? 4096,
      anthropicApiKey: apiKey,
    }) as unknown as BaseChatModel;
  } catch (importErr: any) {
    throw new Error(
      `[gateway] Cannot build Anthropic adapter. ` +
        `Install '@langchain/anthropic': ${importErr.message}`,
    );
  }
}

// ---------------------------------------------------------------------------
// Google Gemini
// ---------------------------------------------------------------------------
async function buildGemini(cfg: ProviderConfig): Promise<BaseChatModel> {
  try {
    const { ChatGoogleGenerativeAI } = await import("@langchain/google-genai");
    const apiKey =
      cfg.apiKey ??
      process.env.GOOGLE_API_KEY ??
      process.env.GEMINI_API_KEY ??
      process.env.GOOGLE_GENERATIVE_AI_KEY;
    if (!apiKey)
      throw new Error(
        "[gateway] GOOGLE_API_KEY / GEMINI_API_KEY / GOOGLE_GENERATIVE_AI_KEY is not set",
      );

    return new ChatGoogleGenerativeAI({
      model: cfg.model,
      temperature: cfg.temperature ?? 0,
      maxOutputTokens: cfg.maxTokens,
      apiKey,
    }) as unknown as BaseChatModel;
  } catch (importErr: any) {
    throw new Error(
      `[gateway] Cannot build Gemini adapter. ` +
        `Install '@langchain/google-genai': ${importErr.message}`,
    );
  }
}

// ---------------------------------------------------------------------------
// Groq (OpenAI-compatible but lightning-fast inference)
// ---------------------------------------------------------------------------
async function buildGroq(cfg: ProviderConfig): Promise<BaseChatModel> {
  try {
    const { ChatGroq } = await import("@langchain/groq");
    const apiKey = cfg.apiKey ?? process.env.GROQ_API_KEY;
    if (!apiKey) throw new Error("[gateway] GROQ_API_KEY is not set");

    return new ChatGroq({
      model: cfg.model,
      temperature: cfg.temperature ?? 0,
      maxTokens: cfg.maxTokens,
      apiKey,
    }) as unknown as BaseChatModel;
  } catch (importErr: any) {
    throw new Error(
      `[gateway] Cannot build Groq adapter. ` +
        `Install '@langchain/groq': ${importErr.message}`,
    );
  }
}

// ---------------------------------------------------------------------------
// Mistral
// ---------------------------------------------------------------------------
async function buildMistral(cfg: ProviderConfig): Promise<BaseChatModel> {
  try {
    const { ChatMistralAI } = await import("@langchain/mistralai");
    const apiKey = cfg.apiKey ?? process.env.MISTRAL_API_KEY;
    if (!apiKey) throw new Error("[gateway] MISTRAL_API_KEY is not set");

    return new ChatMistralAI({
      model: cfg.model,
      temperature: cfg.temperature ?? 0,
      maxTokens: cfg.maxTokens,
      apiKey,
    }) as unknown as BaseChatModel;
  } catch (importErr: any) {
    throw new Error(
      `[gateway] Cannot build Mistral adapter. ` +
        `Install '@langchain/mistralai': ${importErr.message}`,
    );
  }
}

// ---------------------------------------------------------------------------
// OpenRouter  (OpenAI-compat; routes to 200+ models)
// ---------------------------------------------------------------------------
function buildOpenRouter(cfg: ProviderConfig): BaseChatModel {
  const apiKey = cfg.apiKey ?? process.env.OPENROUTER_API_KEY;
  if (!apiKey) throw new Error("[gateway] OPENROUTER_API_KEY is not set");

  return new ChatOpenAI({
    modelName: cfg.model,
    temperature: cfg.temperature ?? 0,
    maxTokens: cfg.maxTokens,
    openAIApiKey: apiKey,
    // OpenRouter uses the OpenAI-compatible endpoint
    configuration: {
      baseURL: cfg.baseURL ?? "https://openrouter.ai/api/v1",
      defaultHeaders: {
        "HTTP-Referer": process.env.FRONTEND_URL ?? "http://localhost:3000",
        "X-Title": process.env.APP_NAME ?? "GapMiner",
        ...cfg.extraHeaders,
      },
    },
  }) as unknown as BaseChatModel;
}

// ---------------------------------------------------------------------------
// Ollama (local)
// ---------------------------------------------------------------------------
async function buildOllama(cfg: ProviderConfig): Promise<BaseChatModel> {
  try {
    const { ChatOllama } = await import("@langchain/ollama");
    return new ChatOllama({
      model: cfg.model,
      temperature: cfg.temperature ?? 0,
      baseUrl: cfg.baseURL ?? process.env.OLLAMA_BASE_URL ?? "http://localhost:11434",
    }) as unknown as BaseChatModel;
  } catch (importErr: any) {
    throw new Error(
      `[gateway] Cannot build Ollama adapter. ` +
        `Install '@langchain/ollama': ${importErr.message}`,
    );
  }
}

// ---------------------------------------------------------------------------
// Generic OpenAI-compatible (custom base URL)
// ---------------------------------------------------------------------------
function buildOpenAICompatible(cfg: ProviderConfig): BaseChatModel {
  if (!cfg.baseURL)
    throw new Error(
      "[gateway] 'baseURL' is required for provider='openai-compatible'",
    );
  const apiKey = cfg.apiKey ?? process.env.OPENAI_COMPATIBLE_API_KEY ?? "sk-no-key";

  return new ChatOpenAI({
    modelName: cfg.model,
    temperature: cfg.temperature ?? 0,
    maxTokens: cfg.maxTokens,
    openAIApiKey: apiKey,
    configuration: {
      baseURL: cfg.baseURL,
      defaultHeaders: cfg.extraHeaders,
    },
  }) as unknown as BaseChatModel;
}

// ---------------------------------------------------------------------------
// Factory — exported
// ---------------------------------------------------------------------------
export async function buildModel(cfg: ProviderConfig): Promise<BaseChatModel> {
  switch (cfg.provider) {
    case "openai":
      return buildOpenAI(cfg);
    case "anthropic":
      return buildAnthropic(cfg);
    case "gemini":
      return buildGemini(cfg);
    case "groq":
      return buildGroq(cfg);
    case "mistral":
      return buildMistral(cfg);
    case "openrouter":
      return buildOpenRouter(cfg);
    case "ollama":
      return buildOllama(cfg);
    case "openai-compatible":
      return buildOpenAICompatible(cfg);
    default:
      throw new Error(`[gateway] Unknown provider: ${(cfg as any).provider}`);
  }
}
