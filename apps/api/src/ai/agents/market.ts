import { SystemMessage, HumanMessage } from "@langchain/core/messages";
import { llm } from "../model.js";
import { SalaryIntelligenceSchema } from "../schemas.js";
import { GraphAnnotation } from "../state.js";

/**
 * AGENT 4: MarketIntelligenceAgent
 * Estimates salary and market trends.
 */
export async function marketIntelligenceAgentNode(state: typeof GraphAnnotation.State) {
  const response = await llm.withStructuredOutput(SalaryIntelligenceSchema).invoke([
    new SystemMessage(`
      You are a Market Value & Salary Intelligence Agent.
      
      TASK:
      1. Estimate the candidate's current market value ($) based on their skills and experience.
      2. Estimate the potential value ($) they could reach if they bridged the identified gaps.
      3. Calculate the salary bump.
      4. Provide negotiation data points based on skill rarity.
      5. Include regional trend observations.
      
      CANDIDATE DATA:
      ${JSON.stringify(state.resumeData)}
      
      GAP ANALYSIS:
      ${JSON.stringify(state.gapAnalysis)}
    `),
    new HumanMessage("Calculate market value and salary intelligence.")
  ]);

  return { marketIntelligence: response };
}
