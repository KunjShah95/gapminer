import { Annotation } from "@langchain/langgraph";

export const GraphAnnotation = Annotation.Root({
  resumeText: Annotation<string>({
    reducer: (x, y) => y ?? x,
    default: () => "",
  }),
  jobDescriptionText: Annotation<string>({
    reducer: (x, y) => y ?? x,
    default: () => "",
  }),
  resumeData: Annotation<any>({
    reducer: (x, y) => y ?? x,
    default: () => null,
  }),
  jdData: Annotation<any>({ reducer: (x, y) => y ?? x, default: () => null }),
  normalizedSkills: Annotation<string[]>({
    reducer: (x, y) => y ?? x,
    default: () => [],
  }),
  normalizedSkillsDetail: Annotation<any[]>({
    reducer: (x, y) => y ?? x,
    default: () => [],
  }),
  skillsByCategory: Annotation<any>({
    reducer: (x, y) => y ?? x,
    default: () => ({}),
  }),
  gapAnalysis: Annotation<any>({
    reducer: (x, y) => y ?? x,
    default: () => null,
  }),
  roadmap: Annotation<any>({ reducer: (x, y) => y ?? x, default: () => null }),
  courseRecommendations: Annotation<any>({
    reducer: (x, y) => y ?? x,
    default: () => null,
  }),
  interviewPrep: Annotation<any>({
    reducer: (x, y) => y ?? x,
    default: () => null,
  }),
  atsOptimization: Annotation<any>({
    reducer: (x, y) => y ?? x,
    default: () => null,
  }),
  marketIntelligence: Annotation<any>({
    reducer: (x, y) => y ?? x,
    default: () => null,
  }),
  benchStrength: Annotation<any>({
    reducer: (x, y) => y ?? x,
    default: () => null,
  }),
  interviewEvaluation: Annotation<any>({
    reducer: (x, y) => y ?? x,
    default: () => null,
  }),
  interviewTranscript: Annotation<string>({
    reducer: (x, y) => y ?? x,
    default: () => "",
  }),
  coverLetterContent: Annotation<any>({
    reducer: (x, y) => y ?? x,
    default: () => null,
  }),
  marketTrends: Annotation<any>({
    reducer: (x, y) => y ?? x,
    default: () => null,
  }),
  skillProficiencies: Annotation<any>({
    reducer: (x, y) => y ?? x,
    default: () => null,
  }),
});
