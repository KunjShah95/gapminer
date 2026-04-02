import { pipeline, env } from "@huggingface/transformers";
import { config } from "../core/config.js";

env.allowLocalModels = true;
env.localModelPath = config.TRANSFORMERS_CACHE_DIR || "./models";
env.useBrowserCache = false;

let nerPipeline = null;
let featureExtractionPipeline = null;
let textGenerationPipeline = null;
let zeroShotPipeline = null;

async function getNER() {
  if (!nerPipeline) {
    nerPipeline = await pipeline(
      "token-classification",
      "Xenova/bert-base-NER",
      { quantized: true },
    );
  }
  return nerPipeline;
}

async function getFeatureExtraction() {
  if (!featureExtractionPipeline) {
    featureExtractionPipeline = await pipeline(
      "feature-extraction",
      "Xenova/all-MiniLM-L6-v2",
      { quantized: true },
    );
  }
  return featureExtractionPipeline;
}

async function getTextGeneration() {
  if (!textGenerationPipeline) {
    textGenerationPipeline = await pipeline(
      "text2text-generation",
      "Xenova/LaMini-Flan-T5-783m",
      { quantized: true },
    );
  }
  return textGenerationPipeline;
}

async function getZeroShot() {
  if (!zeroShotPipeline) {
    zeroShotPipeline = await pipeline(
      "zero-shot-classification",
      "Xenova/deberta-v3-base-zeroshot",
      { quantized: true },
    );
  }
  return zeroShotPipeline;
}

export async function extractSkills(text) {
  const ner = await getNER();
  const result = await ner(text);

  const skillTokens = result
    .filter(
      (entity) =>
        entity.entity.startsWith("B-") || entity.entity.startsWith("I-"),
    )
    .map((entity) => entity.word);

  const unique = [...new Set(skillTokens)];
  const cleaned = unique
    .map((s) => s.replace(/^##/, ""))
    .filter((s) => s.length > 1 && /^[A-Za-z0-9+\-#/.]+$/.test(s));

  return [...new Set(cleaned)];
}

export function cosineSimilarity(a, b) {
  let dot = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  if (normA === 0 || normB === 0) return 0;
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

export async function getEmbedding(text) {
  const fe = await getFeatureExtraction();
  const output = await fe(text, { pooling: "mean", normalize: true });
  return Array.from(output.data);
}

export async function semanticSimilarity(text1, text2) {
  const [emb1, emb2] = await Promise.all([
    getEmbedding(text1),
    getEmbedding(text2),
  ]);
  return cosineSimilarity(emb1, emb2);
}

export async function generateRoadmapContent(gaps, seniority) {
  const tg = await getTextGeneration();

  const gapList = gaps.map((g) => g.skill).join(", ");
  const prompt = `Generate a learning roadmap for a ${seniority} level professional to learn these skills: ${gapList}. Provide a structured plan with weeks, milestones, and key topics to cover.`;

  const result = await tg(prompt, {
    max_new_tokens: 512,
    temperature: 0.7,
    do_sample: true,
  });

  return result[0]?.generated_text || "";
}

export async function classifySkillCategory(skill) {
  const fe = await getFeatureExtraction();

  const categories = [
    "programming_language",
    "framework",
    "database",
    "cloud_platform",
    "devops_tool",
    "soft_skill",
    "methodology",
  ];

  const categoryEmbeddings = await Promise.all(
    categories.map((cat) => getEmbedding(cat)),
  );

  const skillEmbedding = await getEmbedding(skill);

  let bestCategory = categories[0];
  let bestScore = -1;

  for (let i = 0; i < categories.length; i++) {
    const score = cosineSimilarity(skillEmbedding, categoryEmbeddings[i]);
    if (score > bestScore) {
      bestScore = score;
      bestCategory = categories[i];
    }
  }

  return bestCategory;
}

export async function matchSkillToJD(skill, jdText) {
  const fe = await getFeatureExtraction();

  const skillContext = `skill: ${skill}`;
  const [skillEmb, jdEmb] = await Promise.all([
    getEmbedding(skillContext),
    getEmbedding(jdText.substring(0, 2000)),
  ]);

  const similarity = cosineSimilarity(skillEmb, jdEmb);

  return {
    skill,
    relevance: similarity,
    is_mentioned: similarity > 0.5,
  };
}

export async function estimateSkillProficiency(skill, context) {
  const fe = await getFeatureExtraction();

  const proficiencyLevels = ["beginner", "intermediate", "advanced", "expert"];

  const levelEmbeddings = await Promise.all(
    proficiencyLevels.map((level) => getEmbedding(level)),
  );

  const contextEmbedding = await getEmbedding(
    `${skill}: ${context.substring(0, 500)}`,
  );

  let bestLevel = proficiencyLevels[0];
  let bestScore = -1;

  for (let i = 0; i < proficiencyLevels.length; i++) {
    const score = cosineSimilarity(contextEmbedding, levelEmbeddings[i]);
    if (score > bestScore) {
      bestScore = score;
      bestLevel = proficiencyLevels[i];
    }
  }

  const confidence = Math.min(bestScore * 1.5, 0.95);

  return {
    skill,
    proficiency: bestLevel,
    confidence,
  };
}

export async function generateCoverLetter(resumeData, jdData) {
  const tg = await getTextGeneration();

  const prompt = `Write a professional cover letter for a candidate applying to the position of ${jdData.title || "the role"}. 

Candidate background: ${JSON.stringify(resumeData.workExperience || []).substring(0, 500)}
Key skills: ${(resumeData.skills || []).join(", ")}

Job requirements: ${JSON.stringify(jdData.requiredSkills || []).substring(0, 500)}

Write a compelling cover letter that highlights relevant experience and skills.`;

  const result = await tg(prompt, {
    max_new_tokens: 512,
    temperature: 0.7,
    do_sample: true,
  });

  return result[0]?.generated_text || "";
}

export async function predictMarketTrends(skills) {
  const fe = await getFeatureExtraction();

  const trendIndicators = [
    "emerging technology",
    "established technology",
    "declining technology",
    "high demand skill",
    "niche skill",
    "mainstream skill",
  ];

  const trendEmbeddings = await Promise.all(
    trendIndicators.map((indicator) => getEmbedding(indicator)),
  );

  const trendPredictions = [];

  for (const skill of skills) {
    const skillEmbedding = await getEmbedding(
      `${skill} current market demand 2024 2025`,
    );

    const scores = trendEmbeddings.map((trendEmb) =>
      cosineSimilarity(skillEmbedding, trendEmb),
    );

    const maxScore = Math.max(...scores);
    const maxIndex = scores.indexOf(maxScore);

    trendPredictions.push({
      skill,
      trend: trendIndicators[maxIndex],
      confidence: Math.min(maxScore * 1.3, 0.9),
      demandScore: Math.round(((scores[3] + scores[5]) / 2) * 100),
    });
  }

  return trendPredictions;
}

export async function normalizeSkillName(skill, knownSkills) {
  const fe = await getFeatureExtraction();

  const skillEmbedding = await getEmbedding(skill);

  const sampleSkills = knownSkills.slice(0, 100);
  const knownEmbeddings = await Promise.all(
    sampleSkills.map((s) => getEmbedding(s)),
  );

  let bestMatch = skill;
  let bestScore = 0;

  for (let i = 0; i < sampleSkills.length; i++) {
    const score = cosineSimilarity(skillEmbedding, knownEmbeddings[i]);
    if (score > bestScore && score > 0.85) {
      bestScore = score;
      bestMatch = sampleSkills[i];
    }
  }

  return {
    original: skill,
    canonical: bestMatch,
    confidence: bestScore,
  };
}

export async function generateInterviewQuestions(
  skills,
  difficulty = "medium",
) {
  const tg = await getTextGeneration();

  const skillList = skills.slice(0, 5).join(", ");
  const prompt = `Generate 5 technical interview questions about ${skillList} at ${difficulty} difficulty level. Format each question on a new line.`;

  const result = await tg(prompt, {
    max_new_tokens: 384,
    temperature: 0.8,
    do_sample: true,
  });

  const text = result[0]?.generated_text || "";
  return text
    .split("\n")
    .filter((q) => q.trim().length > 10)
    .map((q) => ({
      question: q.replace(/^\d+[\.\)]\s*/, "").trim(),
      difficulty,
    }));
}

export async function classifyJobDescription(jdText) {
  const zs = await getZeroShot();

  const categories = [
    "software engineering",
    "data science",
    "devops",
    "product management",
    "design",
    "security",
    "QA testing",
    "machine learning",
    "cloud infrastructure",
    "frontend development",
    "backend development",
    "full stack development",
    "mobile development",
    "blockchain",
  ];

  const result = await zs(jdText.substring(0, 3000), categories, {
    multi_label: true,
  });

  const topCategories = result.labels
    .filter((_, i) => result.scores[i] > 0.3)
    .slice(0, 3)
    .map((label, i) => ({
      category: label,
      confidence: result.scores[i],
    }));

  return topCategories;
}

export async function classifySeniorityLevel(jdText) {
  const zs = await getZeroShot();

  const levels = [
    "intern",
    "junior",
    "mid-level",
    "senior",
    "staff",
    "principal",
    "director",
    "vp",
    "cto",
  ];

  const result = await zs(jdText.substring(0, 2000), levels, {
    multi_label: false,
  });

  return {
    level: result.labels[0],
    confidence: result.scores[0],
  };
}

export async function classifyWorkArrangement(jdText) {
  const zs = await getZeroShot();

  const arrangements = ["remote", "hybrid", "on-site", "flexible"];

  const result = await zs(jdText.substring(0, 1000), arrangements, {
    multi_label: false,
  });

  return {
    arrangement: result.labels[0],
    confidence: result.scores[0],
  };
}

export async function analyzeResumeSentiment(text) {
  const zs = await getZeroShot();

  const sentiments = [
    "confident",
    "humble",
    "enthusiastic",
    "neutral",
    "arrogant",
    "uncertain",
  ];

  const result = await zs(text.substring(0, 2000), sentiments, {
    multi_label: false,
  });

  return {
    sentiment: result.labels[0],
    confidence: result.scores[0],
    allScores: result.labels.map((label, i) => ({
      label,
      score: result.scores[i],
    })),
  };
}
