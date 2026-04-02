import { SystemMessage, HumanMessage } from "@langchain/core/messages";
import { llm } from "../model.js";
import { MarketTrendSchema } from "../schemas.js";
import { GraphAnnotation } from "../state.js";
import { predictMarketTrends } from "../../services/transformerModels.js";

/**
 * Generates time-series data for skill demand trends.
 * Creates 12 months of historical data for visualization.
 */
export function generateSkillTrendData(skillName: string, trend: "emerging" | "stable" | "declining", demandScore: number) {
  const months = [];
  const baseDate = new Date();

  // Generate 12 months of data
  for (let i = 11; i >= 0; i--) {
    const date = new Date(baseDate);
    date.setMonth(date.getMonth() - i);

    // Calculate trend factor
    let trendFactor = 1;
    if (trend === "emerging") {
      trendFactor = 0.7 + (0.3 * ((12 - i) / 12));
    } else if (trend === "declining") {
      trendFactor = 1.3 - (0.3 * ((12 - i) / 12));
    }

    // Add some randomness
    const randomFactor = 0.9 + Math.random() * 0.2;
    const value = Math.round(demandScore * trendFactor * randomFactor);

    months.push({
      month: date.toISOString().slice(0, 7), // YYYY-MM format
      demand: Math.min(100, Math.max(0, value)),
      jobPostings: Math.round(value * 10 + Math.random() * 100),
    });
  }

  return months;
}

/**
 * Get top trending skills across categories.
 * This can be called independently or as part of the pipeline.
 */
export async function getTopTrendingSkills(
  category?: string,
  limit: number = 10
): Promise<Array<{
  skill: string;
  category: string;
  trend: "emerging" | "stable" | "declining";
  demandScore: number;
  growthRate: number;
  historicalData: ReturnType<typeof generateSkillTrendData>;
}>> {
  // Define skill categories with their demand characteristics
  const skillCategories: Record<string, Array<{ skill: string; baseDemand: number; trend: "emerging" | "stable" | "declining" }>> = {
    "Programming Languages": [
      { skill: "Python", baseDemand: 95, trend: "stable" },
      { skill: "TypeScript", baseDemand: 88, trend: "emerging" },
      { skill: "Rust", baseDemand: 72, trend: "emerging" },
      { skill: "Go", baseDemand: 78, trend: "emerging" },
      { skill: "Java", baseDemand: 85, trend: "stable" },
      { skill: "C++", baseDemand: 75, trend: "stable" },
      { skill: "JavaScript", baseDemand: 92, trend: "stable" },
      { skill: "Kotlin", baseDemand: 70, trend: "emerging" },
    ],
    "Web Frameworks": [
      { skill: "React", baseDemand: 94, trend: "stable" },
      { skill: "Next.js", baseDemand: 85, trend: "emerging" },
      { skill: "Vue.js", baseDemand: 76, trend: "stable" },
      { skill: "Angular", baseDemand: 72, trend: "declining" },
      { skill: "Svelte", baseDemand: 65, trend: "emerging" },
      { skill: "Django", baseDemand: 78, trend: "stable" },
      { skill: "FastAPI", baseDemand: 82, trend: "emerging" },
    ],
    "Cloud & DevOps": [
      { skill: "AWS", baseDemand: 93, trend: "stable" },
      { skill: "Kubernetes", baseDemand: 88, trend: "emerging" },
      { skill: "Docker", baseDemand: 90, trend: "stable" },
      { skill: "Terraform", baseDemand: 80, trend: "emerging" },
      { skill: "Azure", baseDemand: 85, trend: "stable" },
      { skill: "GCP", baseDemand: 78, trend: "stable" },
      { skill: "CI/CD", baseDemand: 86, trend: "stable" },
    ],
    "AI/ML": [
      { skill: "TensorFlow", baseDemand: 82, trend: "emerging" },
      { skill: "PyTorch", baseDemand: 85, trend: "emerging" },
      { skill: "LLMs", baseDemand: 91, trend: "emerging" },
      { skill: "MLOps", baseDemand: 79, trend: "emerging" },
      { skill: "Prompt Engineering", baseDemand: 88, trend: "emerging" },
      { skill: "LangChain", baseDemand: 75, trend: "emerging" },
    ],
    "Data": [
      { skill: "PostgreSQL", baseDemand: 88, trend: "stable" },
      { skill: "MongoDB", baseDemand: 80, trend: "stable" },
      { skill: "Redis", baseDemand: 82, trend: "stable" },
      { skill: "Snowflake", baseDemand: 76, trend: "emerging" },
      { skill: "Apache Spark", baseDemand: 78, trend: "stable" },
      { skill: "ClickHouse", baseDemand: 68, trend: "emerging" },
    ],
  };

  let allSkills: Array<{
    skill: string;
    category: string;
    trend: "emerging" | "stable" | "declining";
    demandScore: number;
    growthRate: number;
    historicalData: ReturnType<typeof generateSkillTrendData>;
  }> = [];

  for (const [cat, skills] of Object.entries(skillCategories)) {
    if (category && category !== cat) continue;

    for (const skill of skills) {
      const growthRate = skill.trend === "emerging"
        ? 15 + Math.random() * 20
        : skill.trend === "declining"
        ? -(10 + Math.random() * 15)
        : -5 + Math.random() * 10;

      allSkills.push({
        skill: skill.skill,
        category: cat,
        trend: skill.trend,
        demandScore: skill.baseDemand,
        growthRate: Math.round(growthRate * 10) / 10,
        historicalData: generateSkillTrendData(skill.skill, skill.trend, skill.baseDemand),
      });
    }
  }

  // Sort by demand score descending
  allSkills.sort((a, b) => b.demandScore - a.demandScore);

  return allSkills.slice(0, limit);
}

/**
 * AGENT 10: MarketTrendAgent
 * Predicts skill demand trends using transformer embeddings + LLM analysis.
 */
export async function marketTrendAgentNode(
  state: typeof GraphAnnotation.State,
) {
  const allSkills = [
    ...state.normalizedSkills,
    ...(state.jdData.requiredSkills?.map((s: any) => s.name) || []),
  ];
  const uniqueSkills = [...new Set(allSkills)];

  const transformerTrends = await predictMarketTrends(
    uniqueSkills.slice(0, 20),
  );

  const response = await llm.withStructuredOutput(MarketTrendSchema).invoke([
    new SystemMessage(`
      You are a Labor Market Analyst specializing in tech industry trends.

      CANDIDATE SKILLS: ${state.normalizedSkills.join(", ")}
      JD REQUIRED SKILLS: ${state.jdData.requiredSkills?.map((s: any) => s.name).join(", ")}

      TRANSFORMER-BASED TREND ANALYSIS:
      ${JSON.stringify(transformerTrends)}

      TASK:
      1. Analyze current market demand for these skills.
      2. Identify emerging vs declining technologies.
      3. Predict growth trajectories for next 12 months.
      4. Identify the top 5 hottest skills in this domain.
      5. Provide a market summary for this role type.
    `),
    new HumanMessage("Generate market trend analysis."),
  ]);

  return {
    marketTrends: {
      ...response,
      transformerPredictions: transformerTrends,
    },
  };
}
