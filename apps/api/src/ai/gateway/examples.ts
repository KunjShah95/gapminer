/**
 * AI Gateway — Usage Examples
 *
 * This file demonstrates how to use the gateway in your agents.
 * It is NOT imported anywhere — it's purely illustrative.
 */

import { getGateway, MODELS, defaultFallbackChain, cheapFallbackChain } from "./index.js";
import { z } from "zod";

// ── Example 1: Simple text completion with Groq (fast!) ──────────────────────
async function example1() {
  const gw = getGateway();
  const result = await gw.invoke({
    primary: MODELS.groq.llama3_70b,
    fallbacks: defaultFallbackChain,  // fallback: openai → ollama
    messages: [
      { role: "system", content: "You are a career counsellor." },
      { role: "user", content: "What skills should a junior React developer learn next?" },
    ],
    // Auto-generate a cache key from message content + model
    // Pass cacheKey: null to bypass cache entirely
    cacheTtlSeconds: 1800, // 30 min
  });

  console.log("Provider used:", result.resolvedProvider, result.resolvedModel);
  console.log("From cache:", result.fromCache);
  console.log("Latency:", result.latencyMs, "ms");
  console.log("Content:", result.content);
}

// ── Example 2: Structured output with Claude ── ───────────────────────────────
async function example2() {
  const gw = getGateway();

  const SkillGapSchema = z.object({
    missingSkills: z.array(z.string()),
    matchScore: z.number().min(0).max(100),
    verdict: z.enum(["strong_match", "partial_match", "weak_match"]),
  });

  const result = await gw.invokeStructured<z.infer<typeof SkillGapSchema>>(
    {
      primary: MODELS.anthropic.claude35_sonnet,
      fallbacks: [MODELS.openai.gpt4o, MODELS.gemini.gemini15_pro],
      messages: [
        { role: "system", content: "Compare candidate and JD skills." },
        {
          role: "user",
          content: "Candidate: React, TS, Node. JD requires: React, TS, GraphQL, AWS.",
        },
      ],
      cacheKey: "skill-gap-demo-v1",
      cacheTtlSeconds: 3600,
    },
    SkillGapSchema,
  );

  console.log("Structured result:", result.content);
  // → { missingSkills: ["GraphQL", "AWS"], matchScore: 65, verdict: "partial_match" }
}

// ── Example 3: SSE streaming with Mistral ────────────────────────────────────
async function example3() {
  const gw = getGateway();
  process.stdout.write("Streaming: ");

  for await (const chunk of gw.stream({
    primary: MODELS.mistral.large,
    fallbacks: [MODELS.groq.llama3_70b],
    messages: [
      { role: "user", content: "Write a 2-sentence cover letter intro." },
    ],
    cacheKey: null, // never cache streams
  })) {
    process.stdout.write(chunk);
  }
  console.log("\nDone!");
}

// ── Example 4: Cheap chain for batch processing ──────────────────────────────
async function example4() {
  const gw = getGateway();
  const result = await gw.invoke({
    primary: MODELS.groq.llama3_8b,
    fallbacks: cheapFallbackChain,
    messages: [{ role: "user", content: "Summarise this resume in one sentence." }],
    cacheTtlSeconds: 7200,
  });
  console.log(result.content);
}

// ── Example 5: Custom OpenAI-compatible endpoint (e.g. LM Studio) ────────────
async function example5() {
  const gw = getGateway();
  const result = await gw.invoke({
    primary: {
      provider: "openai-compatible",
      model: "lmstudio-community/Phi-3.1-mini-128k-instruct-GGUF",
      baseURL: "http://localhost:1234/v1",
      apiKey: "lm-studio",  // LM Studio ignores the key
      temperature: 0.1,
    },
    messages: [{ role: "user", content: "Hello from GapMiner!" }],
    cacheKey: null,
  });
  console.log(result.content);
}

export { example1, example2, example3, example4, example5 };
