import { StateGraph, START, END } from "@langchain/langgraph";
import { GraphAnnotation } from "./state.js";
import { parseAgentNode } from "./agents/parse.js";
import { normalizationAgentNode } from "./agents/normalize.js";
import { matchingAgentNode } from "./agents/match.js";
import { marketIntelligenceAgentNode } from "./agents/market.js";
import { benchStrengthAgentNode } from "./agents/bench.js";
import { interviewEvaluationAgentNode } from "./agents/eval.js";
import { insightAgentNode } from "./agents/insights.js";
import { atsOptimizationAgentNode } from "./agents/ats.js";
import { coverLetterAgentNode } from "./agents/coverLetter.js";
import { marketTrendAgentNode } from "./agents/marketTrend.js";
import { skillProficiencyAgentNode } from "./agents/skillProficiency.js";

/**
 * The Master Orchestrator Agent
 * Coordinates the sequential flow of specialized talent intelligence agents.
 *
 * Pipeline:
 * START → parse → normalize → match → market → bench → eval → insights → ats → coverLetter → marketTrend → skillProficiency → END
 */
const workflow = new StateGraph(GraphAnnotation)
  .addNode("parse", parseAgentNode)
  .addNode("normalize", normalizationAgentNode)
  .addNode("match", matchingAgentNode)
  .addNode("market", marketIntelligenceAgentNode)
  .addNode("bench", benchStrengthAgentNode)
  .addNode("eval", interviewEvaluationAgentNode)
  .addNode("insights", insightAgentNode)
  .addNode("ats", atsOptimizationAgentNode)
  .addNode("coverLetter", coverLetterAgentNode)
  .addNode("marketTrend", marketTrendAgentNode)
  .addNode("skillProficiency", skillProficiencyAgentNode)

  .addEdge(START, "parse")
  .addEdge("parse", "normalize")
  .addEdge("normalize", "match")
  .addEdge("match", "market")
  .addEdge("market", "bench")
  .addEdge("bench", "eval")
  .addEdge("eval", "insights")
  .addEdge("insights", "ats")
  .addEdge("ats", "coverLetter")
  .addEdge("coverLetter", "marketTrend")
  .addEdge("marketTrend", "skillProficiency")
  .addEdge("skillProficiency", END);

export const gapminerAgentApp = workflow.compile();

/**
 * Entry point for running the full analysis pipeline.
 */
export async function runGapminerAnalysis(
  resumeText: string,
  jobDescriptionText: string,
) {
  const initialState = {
    resumeText: resumeText,
    jobDescriptionText: jobDescriptionText,
  };

  const stream = await gapminerAgentApp.streamEvents(initialState, {
    version: "v2",
  });
  return stream;
}
