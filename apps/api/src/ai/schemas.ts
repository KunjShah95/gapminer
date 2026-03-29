import { z } from "zod";

export const ResumeExtractionSchema = z.object({
  personalInfo: z.object({
    name: z.string().describe("The candidate's full name."),
    email: z.string().optional().describe("Primary contact email."),
    location: z.string().optional().describe("Candidate's location (City, Country)."),
    contact: z.string().optional().describe("Phone number or other contact info."),
  }),
  workExperience: z.array(z.object({
    company: z.string(),
    role: z.string(),
    duration: z.string().describe("Duration of employment (e.g., 'Jan 2020 - Present')"),
    responsibilities: z.array(z.string()).describe("Key responsibilities and achievements"),
  })),
  education: z.array(z.object({
    institution: z.string(),
    degree: z.string(),
    field: z.string().optional(),
    year: z.string().optional(),
  })),
  skills: z.array(z.object({
    name: z.string(),
    proficiency: z.enum(["Beginner", "Intermediate", "Expert"]).optional(),
  })).describe("A list of technical and soft skills explicitly mentioned."),
  projects: z.array(z.object({
    title: z.string(),
    description: z.string(),
    technologies: z.array(z.string()),
  })).optional(),
  certifications: z.array(z.string()).optional(),
  yearsOfExperience: z.number().describe("Total years of professional experience inferred."),
});

export const JDExtractionSchema = z.object({
  title: z.string().describe("Job title or role name."),
  requiredSkills: z.array(z.object({
    name: z.string(),
    importance: z.enum(["Required", "Preferred"]),
  })).describe("Skills mentioned in the job description."),
  requiredYearsOfExperience: z.number().describe("Total years of experience requested for the role."),
  responsibilities: z.array(z.string()).optional(),
});

export const GapAnalysisSchema = z.object({
  missingSkills: z.array(z.string()).describe("Required JD skills that are missing from the resume."),
  criticalGaps: z.array(z.string()).describe("Mandatory JD skills that are critically absent."),
  matchPercentage: z.number().min(0).max(100).describe("Estimated match percentage (0-100)."),
  experienceGap: z.string().describe("Brief analysis of the experience level gap."),
});

export const RoadmapGenerationSchema = z.object({
  steps: z.array(
    z.object({
      title: z.string().describe("A short, actionable step title."),
      description: z.string().describe("Detailed strategy to acquire the missing skill or requirement."),
      estimatedTime: z.string().describe("Estimated time to complete this step (e.g. '2 weeks')."),
    })
  ).describe("Step-by-step structured guide to bridge the gaps."),
});

export const CourseRecommendationSchema = z.object({
  courses: z.array(
    z.object({
      courseName: z.string().describe("Name of the recommended course or certification."),
      platform: z.string().describe("Suggested platform (e.g. Coursera, Udemy, AWS)."),
      targetSkill: z.string().describe("The specific missing skill this course addresses."),
    })
  ).describe("A list of recommended courses to fill the identified gaps."),
});

export const InterviewPrepSchema = z.object({
  questions: z.array(
    z.object({
      question: z.string().describe("A high-probability interview question based on the JD and roles."),
      focusArea: z.string().describe("The topic this question tests."),
      idealAnswerStrategy: z.string().describe("Tips on how the candidate should answer this specifically."),
    })
  ).describe("Mock interview questions and strategies tailored to the gap analysis."),
});

export const ResumeOptimizationSchema = z.object({
  bulletPointImprovements: z.array(z.object({
    original: z.string(),
    improved: z.string(),
    reason: z.string().describe("Why this improvement helps with ATS or JD alignment."),
  })),
  optimizedLatex: z.string().describe("The full LaTeX code for an optimized version of the resume."),
});

export const SalaryIntelligenceSchema = z.object({
  currentMarketValue: z.number().describe("Estimated current market value based on existing skills and region."),
  potentialValue: z.number().describe("Estimated market value if identified gaps are filled."),
  salaryBump: z.number().describe("The delta calculation (potential - current)."),
  negotiationPoints: z.array(z.string()).describe("Data points for salary negotiation based on market rarity of skills."),
  regionalTrends: z.string().describe("Brief info on regional demand (e.g., US vs Europe)."),
});

export const BenchStrengthSchema = z.object({
  upSkillingPotential: z.number().min(0).max(100).describe("Score representing how easily this internal candidate can be up-skilled for the role."),
  recommendedTrainingPath: z.string().describe("Specific internal or external training path recommended for up-skilling."),
  readinessTimeline: z.string().describe("Estimated time till the candidate is project-ready (e.g. '3 months')."),
  strategicFit: z.string().describe("Why this employee is a good internal fit vs hiring externally."),
});

export const InterviewEvaluationSchema = z.object({
  scorecard: z.object({
    confidence: z.number().min(0).max(10).describe("Confidence score (1-10)."),
    clarity: z.number().min(0).max(10).describe("Communication clarity (1-10)."),
    technicalCorrectness: z.number().min(0).max(10).describe("Technical accuracy of answers (1-10)."),
  }),
  feedback: z.string().describe("Qualitative feedback for the candidate."),
  identifiedWeaknesses: z.array(z.string()).describe("Specific areas where the candidate struggled during the simulation."),
});
