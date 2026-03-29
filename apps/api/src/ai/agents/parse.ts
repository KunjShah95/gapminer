import { SystemMessage, HumanMessage } from "@langchain/core/messages";
import { llm } from "../model.js";
import { ResumeExtractionSchema, JDExtractionSchema } from "../schemas.js";
import { GraphAnnotation } from "../state.js";

/**
 * AGENT 1: ParseAgent
 * Extracts structured data from raw text.
 */
export async function parseAgentNode(state: typeof GraphAnnotation.State) {
  const [resumeResponse, jdResponse] = await Promise.all([
    llm.withStructuredOutput(ResumeExtractionSchema).invoke([
      new SystemMessage("Extract structured profile information from raw resume text."), 
      new HumanMessage(`<data>\n${state.resumeText}\n</data>`)
    ]),
    llm.withStructuredOutput(JDExtractionSchema).invoke([
      new SystemMessage("Distill a dense job description into definitive requirements."), 
      new HumanMessage(`<data>\n${state.jobDescriptionText}\n</data>`)
    ])
  ]);

  return { resumeData: resumeResponse, jdData: jdResponse };
}
