import { ChatOpenAI } from "@langchain/openai";
import { ChatAnthropic } from "@langchain/anthropic";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { ChatGroq } from "@langchain/groq";
import { ChatOllama } from "@langchain/ollama";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import { config } from "../core/config.js";
import { getProviderFromModel, getModelInfo } from "./aiModels.js";

class LLMService {
  constructor() {
    this.client = null;
    this.currentModel = null;
    this.currentProvider = null;
  }

  initialize(modelId = null, options = {}) {
    const model =
      modelId || config.DEFAULT_MODEL || "anthropic/claude-3.5-sonnet";
    const provider = getProviderFromModel(model);

    this.currentModel = model;
    this.currentProvider = provider;

    const modelInfo = getModelInfo(model);
    const baseOptions = {
      model: model,
      temperature: options.temperature ?? 0.7,
      maxTokens: options.maxTokens ?? 4096,
      ...options,
    };

    switch (provider) {
      case "openai":
      case "openrouter":
        this.client = new ChatOpenAI({
          ...baseOptions,
          openAIApiKey: options.apiKey || config.OPENAI_API_KEY,
          configuration: {
            baseURL:
              provider === "openrouter"
                ? "https://openrouter.ai/api/v1"
                : undefined,
            defaultHeaders:
              provider === "openrouter"
                ? {
                    "HTTP-Referer":
                      config.FRONTEND_URL || "http://localhost:3000",
                    "X-Title": "GapMiner",
                  }
                : undefined,
          },
        });
        break;

      case "anthropic":
        this.client = new ChatAnthropic({
          ...baseOptions,
          anthropicApiKey: options.apiKey || process.env.ANTHROPIC_API_KEY,
        });
        break;

      case "google":
        this.client = new ChatGoogleGenerativeAI({
          ...baseOptions,
          googleApiKey: options.apiKey || process.env.GOOGLE_GENERATIVE_AI_KEY,
          model: model,
        });
        break;

      case "groq":
        this.client = new ChatGroq({
          ...baseOptions,
          groqApiKey: options.apiKey || process.env.GROQ_API_KEY,
        });
        break;

      case "ollama":
        this.client = new ChatOllama({
          ...baseOptions,
          baseUrl: options.baseUrl || config.OLLAMA_BASE_URL,
          model: model,
        });
        break;

      case "huggingface":
        this.client = new ChatOpenAI({
          ...baseOptions,
          openAIApiKey: options.apiKey || process.env.HUGGINGFACE_API_KEY,
          baseURL: "https://api-inference.huggingface.co/v1",
          model: model,
        });
        break;

      case "azure":
        this.client = new ChatOpenAI({
          ...baseOptions,
          openAIApiKey: options.apiKey || process.env.AZURE_OPENAI_API_KEY,
          baseURL: process.env.AZURE_OPENAI_ENDPOINT,
          defaultHeaders: {
            "api-key": options.apiKey || process.env.AZURE_OPENAI_API_KEY,
          },
        });
        break;

      default:
        throw new Error(`Unknown provider: ${provider}`);
    }

    console.log(
      `[LLM] Initialized with model: ${model} (provider: ${provider})`,
    );
    return this;
  }

  async chat(messages, options = {}) {
    if (!this.client) {
      this.initialize(options.model);
    }

    const langchainMessages = messages.map((msg) => {
      if (msg.role === "system") {
        return new SystemMessage(msg.content);
      }
      return new HumanMessage(msg.content);
    });

    try {
      const response = await this.client.invoke(langchainMessages, {
        temperature: options.temperature ?? 0.7,
        maxTokens: options.maxTokens ?? 4096,
      });

      return {
        content: response.content,
        usage: response.usage_metadata
          ? {
              inputTokens: response.usage_metadata.input_tokens,
              outputTokens: response.usage_metadata.output_tokens,
              totalTokens: response.usage_metadata.total_tokens,
            }
          : null,
        model: this.currentModel,
        provider: this.currentProvider,
      };
    } catch (error) {
      console.error("[LLM] Chat error:", error.message);
      throw error;
    }
  }

  async complete(prompt, systemMessage = null, options = {}) {
    const messages = [];
    if (systemMessage) {
      messages.push({ role: "system", content: systemMessage });
    }
    messages.push({ role: "user", content: prompt });
    return this.chat(messages, options);
  }

  async streamChat(messages, options = {}) {
    if (!this.client) {
      this.initialize(options.model);
    }

    const langchainMessages = messages.map((msg) => {
      if (msg.role === "system") {
        return new SystemMessage(msg.content);
      }
      return new HumanMessage(msg.content);
    });

    const stream = await this.client.stream(langchainMessages, {
      temperature: options.temperature ?? 0.7,
      maxTokens: options.maxTokens ?? 4096,
    });

    return stream;
  }

  getCurrentModel() {
    return this.currentModel;
  }

  getCurrentProvider() {
    return this.currentProvider;
  }
}

export const llmService = new LLMService();

export async function createChatCompletion(messages, options = {}) {
  const service = new LLMService();
  return service.initialize(options.model).chat(messages, options);
}

export async function streamChatCompletion(messages, options = {}) {
  const service = new LLMService();
  return service.initialize(options.model).streamChat(messages, options);
}
