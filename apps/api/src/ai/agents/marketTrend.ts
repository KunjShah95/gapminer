import { SystemMessage, HumanMessage } from "@langchain/core/messages";
import { llm } from "../model.js";
import { MarketTrendSchema } from "../schemas.js";
import { GraphAnnotation } from "../state.js";
import { predictMarketTrends } from "../../services/transformerModels.js";
import {
  generateSkillTrendData,
  getTopTrendingSkills,
} from "../../services/marketDemand.js";

export { generateSkillTrendData, getTopTrendingSkills };

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
