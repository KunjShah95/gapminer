import { SystemMessage, HumanMessage } from "@langchain/core/messages";
import { llm } from "../model.js";
import { InterviewEvaluationSchema } from "../schemas.js";
import { GraphAnnotation } from "../state.js";

/**
 * AGENT 6: InterviewEvaluationAgent
 * Scores the performance based on simulation transcript.
 */
export async function interviewEvaluationAgentNode(state: typeof GraphAnnotation.State) {
  if (!state.interviewTranscript) return {};

  const response = await llm.withStructuredOutput(InterviewEvaluationSchema).invoke([
    new SystemMessage(`
      You are an Expert Interview Evaluator.
      
      TASK:
      1. Analyze the transcript of a 10-minute technical screening.
      2. Provide scores for confidence, clarity, and technical correctness.
      3. Identify identified weaknesses and provide qualitative feedback.
      
      CANDIDATE DATA:
      ${JSON.stringify(state.resumeData)}
      
      TRANSCRIPT:
      ${state.interviewTranscript}
      
      JD CONTEXT:
      ${JSON.stringify(state.jdData)}
    `),
    new HumanMessage("Evaluate the interview performance.")
  ]);

  return { interviewEvaluation: response };
}
