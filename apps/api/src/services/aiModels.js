export const AI_PROVIDERS = {
  openai: {
    name: "OpenAI",
    color: "#10a37f",
    models: [
      {
        id: "gpt-4o",
        name: "GPT-4o",
        context: 128000,
        input: 5,
        output: 15,
        supports_vision: true,
      },
      {
        id: "gpt-4o-mini",
        name: "GPT-4o Mini",
        context: 128000,
        input: 0.15,
        output: 0.6,
      },
      {
        id: "gpt-4-turbo",
        name: "GPT-4 Turbo",
        context: 128000,
        input: 10,
        output: 30,
      },
      { id: "gpt-4", name: "GPT-4", context: 8192, input: 30, output: 60 },
      {
        id: "gpt-3.5-turbo",
        name: "GPT-3.5 Turbo",
        context: 16385,
        input: 0.5,
        output: 1.5,
      },
      {
        id: "o1-preview",
        name: "o1 Preview",
        context: 128000,
        input: 15,
        output: 60,
      },
      { id: "o1-mini", name: "o1 Mini", context: 128000, input: 3, output: 12 },
    ],
  },
  anthropic: {
    name: "Anthropic (Claude)",
    color: "#d4a574",
    models: [
      {
        id: "claude-3-5-sonnet-20241022",
        name: "Claude 3.5 Sonnet",
        context: 200000,
        input: 3,
        output: 15,
      },
      {
        id: "claude-3-5-sonnet-20240620",
        name: "Claude 3.5 Sonnet (June)",
        context: 200000,
        input: 3,
        output: 15,
      },
      {
        id: "claude-3-opus-20240229",
        name: "Claude 3 Opus",
        context: 200000,
        input: 15,
        output: 75,
      },
      {
        id: "claude-3-haiku-20240307",
        name: "Claude 3 Haiku",
        context: 200000,
        input: 0.25,
        output: 1.25,
      },
    ],
  },
  google: {
    name: "Google Gemini",
    color: "#4285f4",
    models: [
      {
        id: "gemini-2.0-flash-exp",
        name: "Gemini 2.0 Flash Experimental",
        context: 1000000,
        input: 0,
        output: 0,
      },
      {
        id: "gemini-1.5-pro",
        name: "Gemini 1.5 Pro",
        context: 2000000,
        input: 1.25,
        output: 5,
      },
      {
        id: "gemini-1.5-flash",
        name: "Gemini 1.5 Flash",
        context: 1000000,
        input: 0.075,
        output: 0.3,
      },
      {
        id: "gemini-1.5-flash-8b",
        name: "Gemini 1.5 Flash 8B",
        context: 32768,
        input: 0.075,
        output: 0.3,
      },
    ],
  },
  groq: {
    name: "Groq",
    color: "#8b5cf6",
    models: [
      {
        id: "llama-3.1-70b-versatile",
        name: "Llama 3.1 70B Versatile",
        context: 128000,
        input: 0.59,
        output: 0.79,
      },
      {
        id: "llama-3.1-8b-instant",
        name: "Llama 3.1 8B Instant",
        context: 128000,
        input: 0.05,
        output: 0.08,
      },
      {
        id: "mixtral-8x7b-32768",
        name: "Mixtral 8x7B",
        context: 32768,
        input: 0.24,
        output: 0.24,
      },
      {
        id: "gemma2-9b-it",
        name: "Gemma 2 9B",
        context: 8192,
        input: 0.1,
        output: 0.1,
      },
    ],
  },
  openrouter: {
    name: "OpenRouter (Multi-Provider)",
    color: "#f59e0b",
    models: [
      {
        id: "anthropic/claude-3.5-sonnet",
        name: "Claude 3.5 Sonnet (Router)",
        context: 200000,
        input: 3,
        output: 15,
      },
      {
        id: "openai/gpt-4o",
        name: "GPT-4o (Router)",
        context: 128000,
        input: 5,
        output: 15,
      },
      {
        id: "google/gemini-pro-1.5",
        name: "Gemini Pro 1.5 (Router)",
        context: 2000000,
        input: 1.25,
        output: 5,
      },
      {
        id: "meta-llama/llama-3.1-70b-instruct",
        name: "Llama 3.1 70B",
        context: 128000,
        input: 0.9,
        output: 0.9,
      },
      {
        id: "mistralai/mistral-large",
        name: "Mistral Large",
        context: 128000,
        input: 2,
        output: 6,
      },
      {
        id: "deepseek/deepseek-chat",
        name: "DeepSeek Chat",
        context: 16385,
        input: 0.5,
        output: 0.5,
      },
      {
        id: "cognitivecomputations/dolphin-mixtral-8x7b",
        name: "Dolphin Mixtral",
        context: 32000,
        input: 0.5,
        output: 0.5,
      },
      {
        id: "gryphe/mythomax-l2-13b",
        name: "MythoMax L2 13B",
        context: 4096,
        input: 0.1,
        output: 0.1,
      },
      {
        id: "nousresearch/hermes-3-llama-3.1-8b",
        name: "Hermes 3 Llama 3.1 8B",
        context: 128000,
        input: 0.2,
        output: 0.2,
      },
    ],
  },
  huggingface: {
    name: "HuggingFace Inference",
    color: "#ff9f1c",
    models: [
      {
        id: "meta-llama/Meta-Llama-3.1-70B-Instruct",
        name: "Llama 3.1 70B",
        context: 128000,
        input: 0,
        output: 0,
      },
      {
        id: "meta-llama/Meta-Llama-3.1-8B-Instruct",
        name: "Llama 3.1 8B",
        context: 128000,
        input: 0,
        output: 0,
      },
      {
        id: "microsoft/Phi-3-mini-128k-instruct",
        name: "Phi-3 Mini",
        context: 128000,
        input: 0,
        output: 0,
      },
      {
        id: "mistralai/Mistral-7B-Instruct-v0.2",
        name: "Mistral 7B",
        context: 8192,
        input: 0,
        output: 0,
      },
      {
        id: "codellama/CodeLlama-34b-Instruct-hf",
        name: "CodeLlama 34B",
        context: 16384,
        input: 0,
        output: 0,
      },
      {
        id: "bigcode/starcoder2-15b",
        name: "StarCoder 2 15B",
        context: 16384,
        input: 0,
        output: 0,
      },
    ],
  },
  ollama: {
    name: "Ollama (Local)",
    color: "#10b981",
    models: [
      {
        id: "llama3.1:70b",
        name: "Llama 3.1 70B",
        context: 128000,
        input: 0,
        output: 0,
        local: true,
      },
      {
        id: "llama3.1:8b",
        name: "Llama 3.1 8B",
        context: 128000,
        input: 0,
        output: 0,
        local: true,
      },
      {
        id: "llama3:70b",
        name: "Llama 3 70B",
        context: 8192,
        input: 0,
        output: 0,
        local: true,
      },
      {
        id: "llama3:8b",
        name: "Llama 3 8B",
        context: 8192,
        input: 0,
        output: 0,
        local: true,
      },
      {
        id: "mixtral",
        name: "Mixtral 8x7B",
        context: 32000,
        input: 0,
        output: 0,
        local: true,
      },
      {
        id: "mistral",
        name: "Mistral 7B",
        context: 8192,
        input: 0,
        output: 0,
        local: true,
      },
      {
        id: "codellama",
        name: "CodeLlama",
        context: 16384,
        input: 0,
        output: 0,
        local: true,
      },
      {
        id: "phi3",
        name: "Phi-3",
        context: 4096,
        input: 0,
        output: 0,
        local: true,
      },
      {
        id: "gemma:7b",
        name: "Gemma 7B",
        context: 8192,
        input: 0,
        output: 0,
        local: true,
      },
      {
        id: "qwen2.5:7b",
        name: "Qwen 2.5 7B",
        context: 32768,
        input: 0,
        output: 0,
        local: true,
      },
      {
        id: "aya:8b",
        name: "Aya 8B",
        context: 8192,
        input: 0,
        output: 0,
        local: true,
      },
      {
        id: "command-r",
        name: "Command R",
        context: 128000,
        input: 0,
        output: 0,
        local: true,
      },
    ],
  },
  azure: {
    name: "Azure OpenAI",
    color: "#0078d4",
    models: [
      {
        id: "gpt-4o",
        name: "GPT-4o (Azure)",
        context: 128000,
        input: 5,
        output: 15,
      },
      {
        id: "gpt-4o-mini",
        name: "GPT-4o Mini (Azure)",
        context: 128000,
        input: 0.15,
        output: 0.6,
      },
      {
        id: "gpt-35-turbo",
        name: "GPT-3.5 Turbo (Azure)",
        context: 16385,
        input: 0.5,
        output: 1.5,
      },
    ],
  },
};

export const DEFAULT_PROVIDER = "openrouter";
export const DEFAULT_MODEL = "anthropic/claude-3.5-sonnet";

export function getProviderFromModel(modelId) {
  if (modelId.includes("/")) {
    const [provider] = modelId.split("/");
    if (AI_PROVIDERS[provider]) return provider;
  }
  for (const [key, provider] of Object.entries(AI_PROVIDERS)) {
    if (provider.models.some((m) => m.id === modelId)) {
      return key;
    }
  }
  return DEFAULT_PROVIDER;
}

export function getModelInfo(modelId) {
  for (const [providerKey, provider] of Object.entries(AI_PROVIDERS)) {
    const model = provider.models.find((m) => m.id === modelId);
    if (model) {
      return { ...model, provider: providerKey, providerName: provider.name };
    }
  }
  return null;
}

export function getAllModels() {
  const models = [];
  for (const [providerKey, provider] of Object.entries(AI_PROVIDERS)) {
    for (const model of provider.models) {
      models.push({
        ...model,
        provider: providerKey,
        providerName: provider.name,
        providerColor: provider.color,
      });
    }
  }
  return models;
}
