import { Router } from "express";
import {
  AI_PROVIDERS,
  getAllModels,
  getModelInfo,
  getProviderFromModel,
  DEFAULT_PROVIDER,
  DEFAULT_MODEL,
} from "../../../services/aiModels.js";
import { llmService } from "../../../services/llm.js";
import { config } from "../../../core/config.js";

const router = Router();

router.get("/providers", (_req, res) => {
  const providers = Object.entries(AI_PROVIDERS).map(([key, provider]) => ({
    id: key,
    name: provider.name,
    color: provider.color,
    modelCount: provider.models.length,
  }));
  res.json({ providers });
});

router.get("/models", (_req, res) => {
  const models = getAllModels();
  res.json({ models, count: models.length });
});

router.get("/models/:provider", (req, res) => {
  const { provider } = req.params;
  const providerData = AI_PROVIDERS[provider];

  if (!providerData) {
    return res.status(404).json({ error: "Provider not found" });
  }

  res.json({
    provider: {
      id: provider,
      name: providerData.name,
      color: providerData.color,
    },
    models: providerData.models,
  });
});

router.get("/info/:modelId", (req, res) => {
  const { modelId } = req.params;
  const modelInfo = getModelInfo(modelId);

  if (!modelInfo) {
    return res.status(404).json({ error: "Model not found" });
  }

  res.json({ model: modelInfo });
});

router.post("/chat", async (req, res) => {
  try {
    const { messages, model, temperature, maxTokens, apiKey } = req.body;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: "messages array is required" });
    }

    const modelId = model || config.DEFAULT_MODEL;
    llmService.initialize(modelId, { apiKey, temperature, maxTokens });

    const response = await llmService.chat(messages, {
      model: modelId,
      temperature,
      maxTokens,
      apiKey,
    });

    res.json({
      content: response.content,
      model: response.model,
      provider: response.provider,
      usage: response.usage,
    });
  } catch (error) {
    console.error("[AI Chat] Error:", error);
    res.status(500).json({ error: error.message });
  }
});

router.post("/chat/stream", async (req, res) => {
  try {
    const { messages, model, temperature, maxTokens, apiKey } = req.body;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: "messages array is required" });
    }

    const modelId = model || config.DEFAULT_MODEL;
    llmService.initialize(modelId, { apiKey, temperature, maxTokens });

    const stream = await llmService.streamChat(messages, {
      model: modelId,
      temperature,
      maxTokens,
      apiKey,
    });

    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");

    for await (const chunk of stream) {
      res.write(`data: ${JSON.stringify({ content: chunk.content })}\n\n`);
    }

    res.write("data: [DONE]\n\n");
    res.end();
  } catch (error) {
    console.error("[AI Chat Stream] Error:", error);
    res.status(500).json({ error: error.message });
  }
});

router.post("/test", async (req, res) => {
  try {
    const { model, apiKey, testPrompt } = req.body;

    const modelId = model || config.DEFAULT_MODEL;
    llmService.initialize(modelId, { apiKey });

    const response = await llmService.complete(
      testPrompt || "Say 'Hello from GapMiner!' in exactly 3 words.",
      "You are a helpful assistant.",
      { temperature: 0.7, maxTokens: 50 },
    );

    res.json({
      success: true,
      response: response.content,
      model: response.model,
      provider: response.provider,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

router.get("/health/:model", async (req, res) => {
  try {
    const { model } = req.params;
    const apiKey = req.query.apiKey;

    llmService.initialize(model, { apiKey });

    const response = await llmService.complete(
      "Reply with exactly: OK",
      "You are a helpful assistant.",
      { temperature: 0, maxTokens: 5 },
    );

    const isHealthy = response.content.toLowerCase().includes("ok");

    res.json({
      healthy: isHealthy,
      model: response.model,
      provider: response.provider,
      latency: "ok",
    });
  } catch (error) {
    res.status(500).json({
      healthy: false,
      error: error.message,
    });
  }
});

export default router;
