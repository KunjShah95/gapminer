import { SystemMessage, HumanMessage } from "@langchain/core/messages";
import { llm } from "../model.js";
import { ResumeOptimizationSchema } from "../schemas.js";
import { GraphAnnotation } from "../state.js";

/**
 * AGENT 5 (Merged/Sequential): ATSOptimizationAgent
 * Suggests bullet-point improvements and generates optimized LaTeX.
 */
export async function atsOptimizationAgentNode(state: typeof GraphAnnotation.State) {
  const response = await llm.withStructuredOutput(ResumeOptimizationSchema).invoke([
    new SystemMessage(`
      You are an elite ATS (Applicant Tracking System) Strategist and Senior Resume Writer for Fortune 500 tech roles.
      
      TASK:
      1. CRITIQUE: Analyze the provided candidate data against the Job Description. Identify weaknesses in bullet points (e.g., lack of metrics, weak action verbs).
      2. OPTIMIZE: Suggest 3-5 high-impact improvements for specific experiences. Each improvement must follow the XYZ formula (Accomplished [X] as measured by [Y], by doing [Z]).
      3. GENERATE LATEX: Produce well-structured LaTeX code. Use standard packages (article, geometry, color, enumitem) that are widely compatible. 
         Focus on a clean, modern layout:
         - Quantitative Impact: Every bullet point should ideally have a percentage, dollar amount, or time metric.
         - Keyword Density: Ensure critical JD keywords are naturally integrated into the LaTeX output.
         - Readability: Use clear white-space management in the LaTeX code.
      
      CANDIDATE DATA:
      ${JSON.stringify(state.resumeData)}
      
      JD DATA:
      ${JSON.stringify(state.jdData)}
      
      GAP ANALYSIS:
      ${JSON.stringify(state.gapAnalysis)}
    `),
    new HumanMessage("Optimize the resume for ATS and generate LaTeX content.")
  ]);

  return { atsOptimization: response };
}
