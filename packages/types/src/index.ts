// ─── User & Auth ──────────────────────────────────────────────
export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  plan: "free" | "pro" | "teams" | "enterprise";
  createdAt: string;
  analysesUsed: number;
  analysesLimit: number;
  twoFactorEnabled?: boolean;
  isVerified?: boolean;
}

// ─── Resume ───────────────────────────────────────────────────
export interface Resume {
  id: string;
  userId: string;
  filename: string;
  fileUrl: string;
  parsedData?: ParsedResume;
  uploadedAt: string;
}

export interface ParsedResume {
  name: string;
  email: string;
  phone?: string;
  location?: string;
  summary?: string;
  skills: string[];
  experience: WorkExperience[];
  education: Education[];
  certifications: string[];
  languages: string[];
  seniority: "junior" | "mid" | "senior" | "lead";
}

export interface WorkExperience {
  company: string;
  title: string;
  startDate: string;
  endDate?: string;
  current: boolean;
  description: string;
  skills: string[];
}

export interface Education {
  institution: string;
  degree: string;
  field: string;
  graduationYear: number;
}

// ─── Job Description ──────────────────────────────────────────
export interface JobDescription {
  id: string;
  userId: string;
  title: string;
  company?: string;
  rawText: string;
  sourceUrl?: string;
  parsedData?: ParsedJobDescription;
  scrapedAt?: string;
  createdAt: string;
}

export interface ParsedJobDescription {
  title: string;
  company?: string;
  requiredSkills: string[];
  preferredSkills: string[];
  experience: string;
  education?: string;
  seniority: "junior" | "mid" | "senior" | "lead";
  responsibilities: string[];
  benefits?: string[];
}

// ─── Skill & Gap ──────────────────────────────────────────────
export type SkillStatus = "matched" | "missing" | "partial";
export type GapSeverity = "critical" | "high" | "medium" | "low";

export interface SkillGap {
  skill: string;
  category: string;
  status: SkillStatus;
  severity: GapSeverity;
  confidence: number; // 0-1
  resumeVersion?: string;
  requiredVersion?: string;
  radarScore: number; // 0-100
  marketDemand?: number; // 0-100, from market intelligence
  trendDelta?: number; // % change in demand
}

// ─── Analysis ─────────────────────────────────────────────────
export type AnalysisStatus =
  | "queued"
  | "parsing"
  | "extracting"
  | "comparing"
  | "generating"
  | "complete"
  | "failed";

export interface AnalysisStep {
  id: string;
  label: string;
  status: "pending" | "running" | "done" | "error";
  startedAt?: string;
  completedAt?: string;
  message?: string;
}

export interface Analysis {
  id: string;
  userId: string;
  resumeId: string;
  jobDescriptionId: string;
  status: AnalysisStatus;
  overallScore: number; // 0-100
  resumeStrengthScore: number; // 0-100
  atsScore: number; // 0-100
  seniority: "junior" | "mid" | "senior" | "lead";
  peerPercentile?: number; // e.g. 70 = top 30%
  gaps: SkillGap[];
  steps: AnalysisStep[];
  roadmapId?: string;
  createdAt: string;
  completedAt?: string;
  feedbackRating?: number;
}

// ─── Roadmap ──────────────────────────────────────────────────
export type ResourceType =
  | "course"
  | "video"
  | "documentation"
  | "book"
  | "project"
  | "article";

export interface LearningResource {
  title: string;
  url: string;
  type: ResourceType;
  provider: string;
  estimatedHours: number;
  isFree: boolean;
  rating?: number;
}

export type MilestoneStatus = "not_started" | "learning" | "completed";

export interface RoadmapMilestone {
  id: string;
  week: number;
  title: string;
  description: string;
  skills: string[];
  resources: LearningResource[];
  estimatedHours: number;
  status: MilestoneStatus;
  completedAt?: string;
}

export interface Roadmap {
  id: string;
  analysisId: string;
  userId: string;
  title: string;
  totalWeeks: number;
  totalHours: number;
  milestones: RoadmapMilestone[];
  shareToken?: string;
  exportUrl?: string;
  createdAt: string;
  updatedAt: string;
}

// ─── Market Intelligence ──────────────────────────────────────
export interface MarketSkillTrend {
  skill: string;
  demandScore: number;
  trendDelta: number;
  jobCount: number;
  avgSalaryImpact?: number;
}

// ─── API Responses ────────────────────────────────────────────
export interface ApiResponse<T> {
  data: T;
  message?: string;
  success: boolean;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

export interface AnalyzeRequest {
  resumeId: string;
  jobDescriptionId?: string;
  jobDescriptionText?: string;
  jobDescriptionUrl?: string;
  seniority?: "junior" | "mid" | "senior" | "lead";
}

// ─── Pricing ──────────────────────────────────────────────────
export interface PricingPlan {
  id: "free" | "pro" | "teams" | "enterprise";
  name: string;
  price: number;
  billingCycle: "monthly" | "annual" | "custom";
  features: string[];
  analysesPerMonth: number | "unlimited";
  highlighted?: boolean;
}

// ─── AI Models ─────────────────────────────────────────────────
export interface AIModel {
  id: string;
  name: string;
  context: number;
  input: number;
  output: number;
  supports_vision?: boolean;
  local?: boolean;
  provider: string;
  providerName: string;
  providerColor: string;
}

export interface AIProvider {
  id: string;
  name: string;
  color: string;
  modelCount: number;
}

export interface AIModelInfo extends AIModel {
  provider: string;
  providerName: string;
  providerColor: string;
}

export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface ChatRequest {
  messages: ChatMessage[];
  model?: string;
  temperature?: number;
  maxTokens?: number;
  apiKey?: string;
}

export interface ChatResponse {
  content: string;
  model: string;
  provider: string;
  usage?: {
    inputTokens: number;
    outputTokens: number;
    totalTokens: number;
  };
}
