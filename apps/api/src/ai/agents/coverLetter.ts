import { SystemMessage, HumanMessage } from "@langchain/core/messages";
import { llm } from "../model.js";
import { CoverLetterSchema } from "../schemas.js";
import { GraphAnnotation } from "../state.js";
import { generateCoverLetter } from "../../services/transformerModels.js";

/**
 * AGENT 9: CoverLetterAgent
 * Generates tailored cover letters using transformers + LLM refinement.
 */
export async function coverLetterAgentNode(
  state: typeof GraphAnnotation.State,
) {
  const transformerLetter = await generateCoverLetter(
    state.resumeData,
    state.jdData,
  );

  const response = await llm.withStructuredOutput(CoverLetterSchema).invoke([
    new SystemMessage(`
      You are an expert cover letter writer. Refine and polish the following AI-generated cover letter.
      
      CANDIDATE DATA:
      ${JSON.stringify(state.resumeData)}
      
      JOB DATA:
      ${JSON.stringify(state.jdData)}
      
      GAP ANALYSIS:
      ${JSON.stringify(state.gapAnalysis)}
      
      TRANSFORMER-GENERED DRAFT:
      ${transformerLetter}
      
      TASK:
      1. Polish the language and ensure professional tone.
      2. Highlight the most relevant experiences for this specific role.
      3. Address any critical gaps positively (e.g., "eager to learn X").
      4. Extract key highlights emphasized in the letter.
    `),
    new HumanMessage("Generate a polished cover letter."),
  ]);

  return {
    coverLetter: {
      ...response,
      transformerDraft: transformerLetter,
    },
  };
}
