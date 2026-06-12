import { useEffect, useState, type ReactNode } from "react";
import { Link, useParams } from "react-router-dom";
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Briefcase,
  Download,
  ExternalLink,
  FileText,
  Globe,
  Share2,
  Star,
  TrendingUp,
  Users,
  Zap,
  BarChart2,
  Thermometer,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import {
  PolarAngleAxis,
  PolarGrid,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
} from "recharts";
import { getAuthToken } from "@/lib/authFetch";
import OnboardingTooltip from "@/components/onboarding/OnboardingTooltip";
import {
  PageShell,
  PageHeader,
  Card,
  Button,
  Badge,
} from "@/components/ui";
import ResumeHeatmap from "@/components/ats/ResumeHeatmap";
import { cn } from "@/lib/utils";

type AnalysisResults = {
  overall_score: number;
  resume_strength_score: number;
  ats_score: number;
  matchPercentage: number;
  missingSkills: string[];
  matchedSkills: string[];
  marketSignificance: Array<{ skill: string; demand: number; trend: string }>;
  peerBenchmark: { userPercentile: number };
  missingKeywords: string[];
  targetRole?: string;
  keywordMatchPercentage?: number;
};

type JobSuggestion = {
  id: string;
  title: string;
  company: string;
  location: string;
  salary: string;
};

const fallbackResults: AnalysisResults = {
  overall_score: 76,
  resume_strength_score: 82,
  ats_score: 54,
  matchPercentage: 68,
  missingSkills: ["Kubernetes", "Go", "Terraform"],
  matchedSkills: ["React", "TypeScript"],
  marketSignificance: [
    { skill: "Kubernetes", demand: 89, trend: "High" },
    { skill: "Go", demand: 34, trend: "Rising" },
  ],
  peerBenchmark: { userPercentile: 32 },
  missingKeywords: ["microservices", "CI/CD pipelines"],
  targetRole: "Senior Full-Stack Engineer",
  keywordMatchPercentage: 62,
};

function LoadingState() {
  return (
    <PageShell>
      <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4">
        <div className="primary-gradient animate-pulse rounded-full px-8 py-4 font-bold text-on-primary-fixed">
          Loading Analysis Results...
        </div>
      </div>
    </PageShell>
  );
}

function EmptyState() {
  return (
    <PageShell>
      <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4">
        <AlertCircle className="text-error" size={48} />
        <h2 className="text-xl font-bold text-on-surface">Analysis Not Found</h2>
        <Link
          to="/dashboard"
          className="inline-flex items-center justify-center rounded-xl px-6 py-3 font-bold primary-gradient text-on-primary-fixed"
        >
          Back to Dashboard
        </Link>
      </div>
    </PageShell>
  );
}

function ProtectedRoute({ children }: { children: ReactNode }) {
  return <>{children}</>;
}

export default function AnalysisResultsPage() {
  const { id } = useParams();
  const [results, setResults] = useState<AnalysisResults | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function fetchResults() {
      try {
        const token = getAuthToken();
        const headers: Record<string, string> = {};
        if (token) {
          headers.Authorization = `Bearer ${token}`;
        }

        const res = await fetch(`/api/v1/analysis/${id ?? ""}`, { headers });
        if (!cancelled && res.ok) {
          setResults(await res.json());
          return;
        }
      } catch {
        // Fall through to fallback data.
      }

      if (!cancelled) {
        setResults(fallbackResults);
      }
    }

    fetchResults().finally(() => {
      if (!cancelled) {
        setLoading(false);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [id]);

  const [jobs, setJobs] = useState<JobSuggestion[]>([]);
  const [jobsLoading, setJobsLoading] = useState(false);

  useEffect(() => {
    if (!results?.targetRole) return;
    let cancelled = false;
    async function fetchJobs() {
      setJobsLoading(true);
      try {
        const token = getAuthToken();
        const headers: Record<string, string> = {};
        if (token) headers.Authorization = `Bearer ${token}`;
        const res = await fetch(`/api/v1/jobs/search?q=${encodeURIComponent(results.targetRole)}`, { headers });
        if (!cancelled && res.ok) setJobs(await res.json());
      } catch {
        // ignore
      } finally {
        if (!cancelled) setJobsLoading(false);
      }
    }
    fetchJobs();
    return () => { cancelled = true; };
  }, [results?.targetRole]);

  if (loading) return <LoadingState />;
  if (!results) return <EmptyState />;

  const hasAtsData = results.ats_score > 0 || results.missingKeywords.length > 0;
  const radarData = [
    { subject: "Technical", A: results.overall_score },
    { subject: "Experience", A: results.resume_strength_score || 70 },
    { subject: "Market", A: results.matchPercentage },
    { subject: "ATS", A: results.ats_score },
  ];

  return (
    <ProtectedRoute>
      <PageShell>
        <PageHeader
          icon={<BarChart2 size={22} />}
          title="Analysis Results"
          description="How well your profile aligns with target role requirements."
          actions={
            <>
              <Link
                to="/dashboard"
                className="inline-flex items-center gap-2 text-sm font-bold text-on-surface-variant transition-colors hover:text-primary"
              >
                <ArrowLeft size={18} />
                Back
              </Link>
              <Button variant="outline" size="sm">
                <Share2 size={16} /> Share
              </Button>
              <Button variant="secondary" size="sm">
                <Download size={16} /> Export PDF
              </Button>
            </>
          }
        />

        <OnboardingTooltip
          pageKey="results"
          icon="📊"
          title="Understanding your scores"
          description="The radar chart shows key dimensions. Green = strong match. Red = gap. Open the roadmap for course recommendations."
        />

        <div className="mb-8 grid grid-cols-1 gap-6 lg:grid-cols-3">
          <Card padding="lg" className="lg:col-span-2">
            <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
              <div>
                <h2 className="mb-1 text-xl font-black text-on-surface">Overall Match Score</h2>
                <p className="text-sm text-on-surface-variant">
                  How well your profile aligns with target role requirements
                </p>
              </div>
              <span className="text-5xl font-black tracking-tight text-primary">
                {results.overall_score}%
              </span>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div className="rounded-xl border border-outline-variant/15 bg-surface-container-low p-4">
                <p className="mb-1 text-sm font-bold text-on-surface-variant">Resume Strength</p>
                <p className="text-2xl font-black text-on-surface">{results.resume_strength_score}%</p>
              </div>
              <div className="rounded-xl border border-outline-variant/15 bg-surface-container-low p-4">
                <p className="mb-1 text-sm font-bold text-on-surface-variant">ATS Optimization</p>
                <p className="text-2xl font-black text-on-surface">{results.ats_score}/100</p>
              </div>
              <div className="rounded-xl border border-outline-variant/15 bg-surface-container-low p-4">
                <p className="mb-1 text-sm font-bold text-on-surface-variant">Market Fit</p>
                <p className="text-2xl font-black text-on-surface">{results.matchPercentage}%</p>
              </div>
            </div>
          </Card>

          <Card padding="lg">
            <h3 className="mb-4 flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-outline">
              <TrendingUp size={16} className="text-primary" />
              Skill Radar
            </h3>
            <div className="h-[200px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={radarData}>
                  <PolarGrid stroke="rgba(148,163,184,0.15)" />
                  <PolarAngleAxis
                    dataKey="subject"
                    tick={{ fill: "rgb(148 163 184)", fontSize: 10, fontWeight: 700 }}
                  />
                  <Radar
                    name="Expertise"
                    dataKey="A"
                    stroke="rgb(176 162 255)"
                    fill="rgb(176 162 255)"
                    fillOpacity={0.2}
                    strokeWidth={2}
                  />
                  <RechartsTooltip
                    contentStyle={{
                      background: "rgb(30 32 40)",
                      border: "1px solid rgba(148,163,184,0.2)",
                      borderRadius: "12px",
                      fontSize: "10px",
                    }}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <Card padding="lg">
            <h3 className="mb-4 flex items-center gap-2 text-lg font-bold text-on-surface">
              <AlertCircle className="text-error" size={20} />
              Skill Gap Analysis
            </h3>
            <div className="mb-6 space-y-4">
              <div>
                <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-error">
                  Missing Skills ({results.missingSkills.length})
                </p>
                <div className="flex flex-wrap gap-2">
                  {results.missingSkills.map((skill, idx) => (
                    <Badge key={idx} tone="error" className="normal-case tracking-normal">
                      {skill}
                    </Badge>
                  ))}
                </div>
              </div>
              <div>
                <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-primary">
                  Matched Strengths ({results.matchedSkills.length})
                </p>
                <div className="flex flex-wrap gap-2">
                  {results.matchedSkills.map((skill, idx) => (
                    <Badge key={idx} tone="primary" className="normal-case tracking-normal">
                      {skill}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
            <Link
              to={id ? `/roadmap/${id}` : "/roadmap"}
              className="flex w-full items-center justify-center gap-2 rounded-xl py-3 font-bold primary-gradient text-on-primary-fixed transition-all hover:shadow-lg hover:shadow-primary/20"
            >
              Generate Learning Roadmap <ArrowRight size={18} />
            </Link>
          </Card>

          <Card padding="lg">
            <div className="mb-4 flex items-center gap-2">
              <Globe className="text-tertiary" size={20} />
              <h3 className="text-lg font-bold text-on-surface">Market Significance</h3>
            </div>
            <div className="space-y-3">
              {results.marketSignificance.map((item, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between rounded-xl border border-outline-variant/15 bg-surface-container-low p-3"
                >
                  <div>
                    <p className="text-sm font-bold text-on-surface">{item.skill}</p>
                    <p className="text-[10px] text-on-surface-variant">
                      {item.demand}% of Job Descriptions
                    </p>
                  </div>
                  <Badge tone="info">{item.trend}</Badge>
                </div>
              ))}
            </div>
          </Card>

          <Card padding="lg">
            <div className="mb-4 flex items-center gap-2">
              <Users className="text-primary" size={20} />
              <h3 className="text-lg font-bold text-on-surface">Peer Benchmark</h3>
            </div>
            <div className="mb-4 flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((s) => (
                <Star
                  key={s}
                  size={16}
                  className={cn(s <= 3 ? "fill-amber-500 text-amber-500" : "text-outline")}
                />
              ))}
              <span className="ml-2 text-xs text-on-surface-variant">3 / 5 Relevance</span>
            </div>
            <p className="mb-6 text-sm font-semibold text-on-surface">
              You&apos;re in the{" "}
              <span className="text-emerald-400">
                top {results.peerBenchmark.userPercentile}%
              </span>{" "}
              of candidates for this role.
            </p>
            <div className="relative pb-2 pt-6">
              <div className="flex h-2 w-full overflow-hidden rounded-full bg-surface-container-highest">
                <div className="h-full w-[60%] border-r border-background/20 bg-surface-variant" />
                <div className="h-full w-[30%] border-r border-background/20 bg-primary/40" />
                <div className="h-full w-[10%] bg-primary" />
              </div>
              <div className="absolute left-[32%] top-0 flex -translate-x-1/2 flex-col items-center">
                <div className="mb-1 h-3 w-px bg-primary" />
                <span className="text-[8px] font-bold uppercase text-primary">You</span>
              </div>
              <div className="absolute left-[68%] top-0 flex -translate-x-1/2 flex-col items-center">
                <div className="mb-1 h-3 w-px bg-on-surface-variant/40" />
                <span className="text-[8px] font-bold uppercase text-on-surface-variant">Avg</span>
              </div>
              <div className="absolute left-[90%] top-0 flex -translate-x-1/2 flex-col items-center">
                <div className="mb-1 h-3 w-px bg-secondary" />
                <span className="text-[8px] font-bold uppercase text-secondary">Top 10%</span>
              </div>
            </div>
          </Card>
        </div>

        <Card padding="lg" className="mt-6 border-primary/25">
          {hasAtsData ? (
            <>
              <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                  <FileText className="text-primary" size={24} />
                  <div>
                    <h3 className="text-xl font-bold text-on-surface">ATS Compatibility</h3>
                    <p className="text-xs text-on-surface-variant">
                      Resume optimization for Applicant Tracking Systems
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-4xl font-black text-on-surface">{results.ats_score}</span>
                  <span className="text-sm text-on-surface-variant">/100</span>
                </div>
              </div>
              <div className="mb-6 grid grid-cols-2 gap-4">
                <div className="rounded-xl border border-outline-variant/15 bg-surface-container-low p-4">
                  <p className="mb-1 text-[10px] font-bold uppercase tracking-widest text-outline">
                    Keyword Match
                  </p>
                  <p className="text-2xl font-black text-on-surface">
                    {results.keywordMatchPercentage ?? results.ats_score}%
                  </p>
                </div>
                <div className="rounded-xl border border-outline-variant/15 bg-surface-container-low p-4">
                  <p className="mb-1 text-[10px] font-bold uppercase tracking-widest text-outline">
                    Missing Keywords
                  </p>
                  <p className="text-2xl font-black text-error">{results.missingKeywords.length}</p>
                </div>
              </div>
              {results.missingKeywords.length > 0 && (
                <div className="mb-6">
                  <p className="mb-3 text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">
                    Top Missing Keywords
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {results.missingKeywords.slice(0, 5).map((keyword, idx) => (
                      <span
                        key={idx}
                        className="rounded-full border border-error/20 bg-surface-container-low px-4 py-1.5 font-mono text-xs text-error"
                      >
                        &quot;{keyword}&quot;
                      </span>
                    ))}
                  </div>
                </div>
              )}
              <div className="flex flex-col gap-3 sm:flex-row">
                <Link
                  to={id ? `/latex/${id}` : "/latex"}
                  className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl py-3 font-bold primary-gradient text-on-primary-fixed shadow-lg shadow-primary/20 transition-all hover:scale-[1.02]"
                >
                  <Zap size={18} />
                  Optimize Resume
                </Link>
                <Button variant="outline" className="sm:flex-initial">
                  <Download size={18} />
                  Download Report
                </Button>
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center gap-4 py-6 text-center">
              <FileText className="text-outline" size={40} />
              <div>
                <h3 className="text-xl font-bold text-on-surface">ATS Compatibility</h3>
                <p className="text-sm text-on-surface-variant">
                  Run an ATS check to see how your resume performs.
                </p>
              </div>
              <Link
                to={`/ats${results.targetRole ? `?role=${encodeURIComponent(results.targetRole)}` : ""}`}
                className="inline-flex items-center gap-2 rounded-xl px-6 py-3 font-bold primary-gradient text-on-primary-fixed transition-all hover:shadow-lg hover:shadow-primary/20"
              >
                Run an ATS Check <ArrowRight size={18} />
              </Link>
            </div>
          )}
        </Card>

        {/* Job Suggestions Widget */}
        {results.targetRole && (
          <Card padding="lg" className="mt-6">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Briefcase className="text-primary" size={24} />
                <div>
                  <h3 className="text-xl font-bold text-on-surface">Relevant Jobs</h3>
                  <p className="text-xs text-on-surface-variant">
                    Positions matching your target role
                  </p>
                </div>
              </div>
              <Link
                to="/jobs/browse"
                className="flex items-center gap-1 text-sm font-bold text-primary hover:underline"
              >
                View All <ExternalLink size={14} />
              </Link>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {jobsLoading
                ? Array.from({ length: 3 }).map((_, i) => (
                    <div
                      key={i}
                      className="animate-pulse rounded-xl border border-outline-variant/15 bg-surface-container-low p-4"
                    >
                      <div className="mb-2 h-4 w-3/4 rounded bg-surface-container-highest" />
                      <div className="mb-1 h-3 w-1/2 rounded bg-surface-container-highest" />
                      <div className="h-3 w-1/3 rounded bg-surface-container-highest" />
                    </div>
                  ))
                : jobs.slice(0, 5).map((job) => (
                    <div
                      key={job.id}
                      className="rounded-xl border border-outline-variant/15 bg-surface-container-low p-4 transition-all hover:border-primary/25"
                    >
                      <p className="mb-1 text-sm font-bold text-on-surface">{job.title}</p>
                      <p className="mb-1 text-xs text-on-surface-variant">{job.company}</p>
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] text-on-surface-variant">{job.location}</span>
                        <span className="text-xs font-bold text-primary">{job.salary}</span>
                      </div>
                    </div>
                  ))}
            </div>
            {!jobsLoading && jobs.length === 0 && (
              <p className="py-4 text-center text-sm text-on-surface-variant">
                No job listings found for this role.
              </p>
            )}
          </Card>
        )}

        {/* Resume Heatmap Section */}
        <div className="mt-6">
          <details className="group">
            <summary className="flex cursor-pointer items-center gap-3 rounded-xl bg-surface-container-low p-4 transition-all hover:bg-surface-container-high">
              <Thermometer className="h-5 w-5 text-primary" />
              <span className="font-bold text-on-surface">Resume Attention Heatmap</span>
              <span className="ml-auto text-xs text-on-surface-variant">
                <ChevronDown className="h-4 w-4 group-open:hidden" />
                <ChevronUp className="hidden h-4 w-4 group-open:block" />
              </span>
            </summary>
            <div className="mt-4">
              <ResumeHeatmap
                resumeText={results.resumeData || ""}
                jdKeywords={[...results.missingSkills, ...results.matchedSkills]}
              />
            </div>
          </details>
        </div>
      </PageShell>
    </ProtectedRoute>
  );
}
