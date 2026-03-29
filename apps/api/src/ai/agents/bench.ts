import { SystemMessage, HumanMessage } from "@langchain/core/messages";
import { llm } from "../model.js";
import { BenchStrengthSchema } from "../schemas.js";
import { GraphAnnotation } from "../state.js";

/**
 * AGENT 5: BenchStrengthAgent
 * Analyzes internal up-skilling potential for enterprise clients.
 */
export async function benchStrengthAgentNode(state: typeof GraphAnnotation.State) {
  const response = await llm.withStructuredOutput(BenchStrengthSchema).invoke([
    new SystemMessage(`
      You are a Bench Strength Analyst for enterprise-grade talent management.
      
      TASK:
      1. Evaluate the internal employee's up-skilling potential for the specific project requirements (JD).
      2. Construct a strategic training path.
      3. Estimate project-readiness timeline.
      4. Compare internal up-skilling advantage vs external hiring.
      
      CANDIDATE DATA:
      ${JSON.stringify(state.resumeData)}
      
      GAP ANALYSIS:
      ${JSON.stringify(state.gapAnalysis)}
      
      MARKET CONTEXT:
      ${JSON.stringify(state.marketIntelligence)}
    `),
    new HumanMessage("Generate bench strength and up-skilling analysis.")
  ]);

  return { benchStrength: response };
}
