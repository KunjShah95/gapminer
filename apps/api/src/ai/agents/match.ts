import { SystemMessage, HumanMessage } from "@langchain/core/messages";
import { llm } from "../model.js";
import { GapAnalysisSchema } from "../schemas.js";
import { GraphAnnotation } from "../state.js";

/**
 * AGENT 3: MatchingAgent
 * Performs semantic matching and generates gap analysis.
 */
export async function matchingAgentNode(state: typeof GraphAnnotation.State) {
  const requirements = state.jdData.requiredSkills.map((s: any) => `${s.name} (${s.importance})`).join(", ");
  
  const skillsWithProficiency = state.normalizedSkillsDetail
    .map(s => `${s.canonicalName} (${s.proficiency})`)
    .join(", ");

  const categorizedSkills = Object.entries(state.skillsByCategory || {})
    .map(([cat, skills]) => `${cat}: ${(skills as any[]).map(s => s.canonicalName).join(", ")}`)
    .join("; ");
  
  const response = await llm.withStructuredOutput(GapAnalysisSchema).invoke([
    new SystemMessage(`
      Perform a high-precision semantic matching between the candidate's profile and job requirements.
      
      CANDIDATE PROFILE:
      - Normalized Skills: ${state.normalizedSkills.join(", ")}
      - Skills with Proficiency: ${skillsWithProficiency}
      - Skills by Category: ${categorizedSkills}
      - Experience: ${state.resumeData.yearsOfExperience} years
      - Summary: ${JSON.stringify(state.resumeData.workExperience.map((w: any) => w.role))}
      
      JOB REQUIREMENTS:
      - Required/Preferred: ${requirements}
      - Min Experience: ${state.jdData.requiredYearsOfExperience} years
      
      TASK:
      1. Identify missing skills (those required by JD but not present/inferrable in candidate profile).
      2. Identify critical gaps (Required skills missing).
      3. Calculate match percentage (0-100) based on coverage and experience depth.
      4. Note the experience gap.
    `), 
    new HumanMessage("Generate detailed talent intelligence gap analysis.")
  ]);
  
  return { gapAnalysis: response };
}
