import { SystemMessage, HumanMessage } from "@langchain/core/messages";
import { llm } from "../model.js";
import { GapAnalysisSchema } from "../schemas.js";
import { GraphAnnotation } from "../state.js";
import {
  semanticSimilarity,
  matchSkillToJD,
} from "../../services/transformerModels.js";

/**
 * AGENT 3: MatchingAgent
 * Performs semantic matching using transformer embeddings + LLM gap analysis.
 */
export async function matchingAgentNode(state: typeof GraphAnnotation.State) {
  const requirements = state.jdData.requiredSkills
    .map((s: any) => `${s.name} (${s.importance})`)
    .join(", ");
  const jdSkillNames = state.jdData.requiredSkills.map((s: any) => s.name);

  const transformerMatches = await Promise.all(
    jdSkillNames.map((skill: string) =>
      matchSkillToJD(skill, state.jobDescriptionText),
    ),
  );

  const similarityScores = transformerMatches.map((m) => m.relevance);
  const avgSimilarity =
    similarityScores.length > 0
      ? similarityScores.reduce((a, b) => a + b, 0) / similarityScores.length
      : 0;

  const skillsWithProficiency = state.normalizedSkillsDetail
    .map((s) => `${s.canonicalName} (${s.proficiency})`)
    .join(", ");

  const categorizedSkills = Object.entries(state.skillsByCategory || {})
    .map(
      ([cat, skills]) =>
        `${cat}: ${(skills as any[]).map((s) => s.canonicalName).join(", ")}`,
    )
    .join("; ");

  const response = await llm.withStructuredOutput(GapAnalysisSchema).invoke([
    new SystemMessage(`
      Perform a high-precision semantic matching between the candidate's profile and job requirements.
      
      TRANSFORMER-BASED SIMILARITY SCORES:
      Average JD skill relevance: ${(avgSimilarity * 100).toFixed(1)}%
      Individual matches: ${JSON.stringify(transformerMatches)}
      
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
    new HumanMessage("Generate detailed talent intelligence gap analysis."),
  ]);

  const transformerAdjustedScore = Math.round(
    response.matchPercentage * 0.7 + avgSimilarity * 100 * 0.3,
  );

  return {
    gapAnalysis: {
      ...response,
      matchPercentage: Math.min(transformerAdjustedScore, 100),
      transformerSimilarity: avgSimilarity,
      skillMatches: transformerMatches,
    },
  };
}
