import { SystemMessage, HumanMessage } from "@langchain/core/messages";
import { llm } from "../model.js";
import { SkillProficiencySchema } from "../schemas.js";
import { GraphAnnotation } from "../state.js";
import { estimateSkillProficiency } from "../../services/transformerModels.js";

/**
 * AGENT 11: SkillProficiencyAgent
 * Estimates actual skill proficiency levels from resume context using transformers.
 */
export async function skillProficiencyAgentNode(
  state: typeof GraphAnnotation.State,
) {
  const skills = state.normalizedSkillsDetail || [];
  const resumeContext = state.resumeText;

  const transformerProficiencies = await Promise.all(
    skills.map(async (skill) => {
      const skillContext = resumeContext.substring(
        Math.max(0, resumeContext.indexOf(skill.canonicalName) - 100),
        Math.min(
          resumeContext.length,
          resumeContext.indexOf(skill.canonicalName) + 300,
        ),
      );

      return estimateSkillProficiency(
        skill.canonicalName,
        skillContext || resumeContext.substring(0, 500),
      );
    }),
  );

  const response = await llm
    .withStructuredOutput(SkillProficiencySchema)
    .invoke([
      new SystemMessage(`
      You are a Technical Skill Assessor. Estimate the candidate's proficiency levels based on resume context.
      
      CANDIDATE RESUME:
      ${state.resumeText.substring(0, 2000)}
      
      EXTRACTED SKILLS:
      ${state.normalizedSkills.join(", ")}
      
      TRANSFORMER-BASED PROFICIENCY ESTIMATES:
      ${JSON.stringify(transformerProficiencies)}
      
      TASK:
      1. Estimate proficiency level for each skill (Beginner/Intermediate/Advanced/Expert).
      2. Provide confidence scores for each estimate.
      3. Cite specific evidence from the resume text.
      4. Provide an overall skill proficiency assessment.
    `),
      new HumanMessage("Assess skill proficiencies."),
    ]);

  return {
    skillProficiencies: {
      ...response,
      transformerEstimates: transformerProficiencies,
    },
  };
}
