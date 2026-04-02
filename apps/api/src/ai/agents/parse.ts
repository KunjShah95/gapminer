import { SystemMessage, HumanMessage } from "@langchain/core/messages";
import { llm } from "../model.js";
import { ResumeExtractionSchema, JDExtractionSchema } from "../schemas.js";
import { GraphAnnotation } from "../state.js";
import { extractSkills } from "../../services/transformerModels.js";

/**
 * AGENT 1: ParseAgent
 * Extracts structured data from raw text using transformers for skill extraction.
 */
export async function parseAgentNode(state: typeof GraphAnnotation.State) {
  const transformerSkills = await extractSkills(state.resumeText);

  const [resumeResponse, jdResponse] = await Promise.all([
    llm
      .withStructuredOutput(ResumeExtractionSchema)
      .invoke([
        new SystemMessage(
          "Extract structured profile information from raw resume text. Use the pre-extracted skills as a reference.",
        ),
        new HumanMessage(
          `<data>\n${state.resumeText}\n</data>\n\n<extracted_skills>\n${transformerSkills.join(", ")}\n</extracted_skills>`,
        ),
      ]),
    llm
      .withStructuredOutput(JDExtractionSchema)
      .invoke([
        new SystemMessage(
          "Distill a job description into definitive requirements.",
        ),
        new HumanMessage(`<data>\n${state.jobDescriptionText}\n</data>`),
      ]),
  ]);

  const mergedSkills = [
    ...(resumeResponse.skills || []),
    ...transformerSkills.map((name) => ({
      name,
      proficiency: "Intermediate" as const,
    })),
  ];

  const uniqueSkills = mergedSkills.filter(
    (skill, index, self) =>
      index ===
      self.findIndex((s) => s.name.toLowerCase() === skill.name.toLowerCase()),
  );

  return {
    resumeData: { ...resumeResponse, skills: uniqueSkills },
    jdData: jdResponse,
  };
}
