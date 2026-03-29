import { SystemMessage, HumanMessage } from "@langchain/core/messages";
import { llm } from "../model.js";
import { RoadmapGenerationSchema, CourseRecommendationSchema, InterviewPrepSchema } from "../schemas.js";
import { GraphAnnotation } from "../state.js";

/**
 * AGENT 4 (Merged/Sequential): InsightAgent
 * Generates actionable career path data (Roadmap, Courses, Prep).
 */
export async function insightAgentNode(state: typeof GraphAnnotation.State) {
  const [roadmapResponse, courseResponse, interviewResponse] = await Promise.all([
    llm.withStructuredOutput(RoadmapGenerationSchema).invoke([
      new SystemMessage("Generate an actionable roadmap to bridge identified gaps."),
      new HumanMessage(JSON.stringify({ gapAnalysis: state.gapAnalysis, jdData: state.jdData }))
    ]),
    llm.withStructuredOutput(CourseRecommendationSchema).invoke([
      new SystemMessage("Recommend high-quality online courses for missing skills."),
      new HumanMessage(JSON.stringify({ missingSkills: state.gapAnalysis.missingSkills }))
    ]),
    llm.withStructuredOutput(InterviewPrepSchema).invoke([
      new SystemMessage("Prepare the candidate for tough interview rounds focused on their gaps."),
      new HumanMessage(JSON.stringify({ gapAnalysis: state.gapAnalysis, jdData: state.jdData }))
    ])
  ]);

  return { 
    roadmap: roadmapResponse, 
    courseRecommendations: courseResponse, 
    interviewPrep: interviewResponse 
  };
}
