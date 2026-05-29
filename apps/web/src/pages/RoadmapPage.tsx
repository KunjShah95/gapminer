import { useParams, Link } from "react-router-dom";
import {
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
} from "recharts";
import {
  Download,
  Share2,
  BookOpen,
  Youtube,
  Globe,
  CheckCircle2,
  Circle,
  Clock,
  TrendingUp,
  Award,
  ArrowLeft,
  Zap,
  Star,
  ExternalLink,
  Activity,
  GraduationCap,
  Map,
} from "lucide-react";
import { useState, useEffect, useMemo } from "react";
import type { RoadmapMilestone } from "@gapminer/types";
import { getAuthToken } from "@/lib/authFetch";
import OnboardingTooltip from "@/components/onboarding/OnboardingTooltip";
import {
  PageShell,
  PageHeader,
  Card,
  Button,
  Badge,
} from "@/components/ui";
import { cn } from "@/lib/utils";

interface AnalysisData {
  id: string;
  status: string;
  overall_score: number | null;
  resume_strength_score: number | null;
  ats_score: number | null;
  seniority: string;
  resumeData?: any;
  jdData?: any;
  gapAnalysis?: {
    missingSkills?: string[];
    criticalGaps?: string[];
    matchedSkills?: string[];
    matchPercentage?: number;
    experienceGap?: string;
  };
  roadmap?: {
    steps?: Array<{
      title: string;
      description: string;
      estimatedTime: string;
      week: number;
      skills: string[];
      resources: Array<{
        title: string;
        url: string;
        type: "video" | "course" | "documentation" | "book" | "project";
        provider: string;
        estimatedHours: number;
        isFree: boolean;
      }>;
    }>;
  };
  skillGaps?: any[];
  created_at: string;
}

const resourceTypeIcon = (type: string) => {
  switch (type) {
    case "video":
      return { icon: Youtube, color: "text-error" };
    case "course":
      return { icon: BookOpen, color: "text-primary" };
    case "documentation":
      return { icon: Globe, color: "text-tertiary" };
    case "book":
      return { icon: Star, color: "text-secondary" };
    case "project":
      return { icon: Zap, color: "text-primary" };
    default:
      return { icon: Globe, color: "text-outline" };
  }
};

function MilestoneCard({
  milestone,
  index,
}: {
  milestone: RoadmapMilestone;
  index: number;
}) {
  const [expanded, setExpanded] = useState(index === 0);
  const [status, setStatus] = useState<
    "not_started" | "learning" | "completed"
  >(milestone.status);

  const statusTone = {
    not_started: "default" as const,
    learning: "warning" as const,
    completed: "success" as const,
  };

  return (
    <div className={cn("flex gap-6 group", status === "completed" && "opacity-80")}>
      <div className="flex flex-col items-center">
        <div className="flex h-12 w-12 flex-col items-center justify-center rounded-2xl border border-outline-variant/20 bg-surface-container-high text-[10px] font-black uppercase leading-none">
          <span className="text-outline">Wk</span>
          <span className="text-lg text-on-surface">{milestone.week}</span>
        </div>
        <div className="my-2 w-px flex-grow bg-outline-variant/20 group-last:hidden" />
      </div>

      <div className="min-w-0 flex-1 pb-10">
        <Card
          padding="lg"
          hover={!expanded}
          className={cn("overflow-hidden", expanded && "shadow-2xl")}
        >
          <div onClick={() => setExpanded(!expanded)} className="cursor-pointer">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <div className="mb-2 flex flex-wrap items-center gap-2">
                  <h3 className="font-bold text-lg text-on-surface">{milestone.title}</h3>
                  <Badge tone={statusTone[status]}>{status.replace("_", " ")}</Badge>
                </div>
                <div className="flex flex-wrap items-center gap-4 text-xs text-on-surface-variant">
                  <span className="flex items-center gap-1">
                    <Clock size={12} /> {milestone.estimatedHours}h Total
                  </span>
                  <span className="flex items-center gap-1">
                    <BookOpen size={12} /> {milestone.resources.length} Modules
                  </span>
                </div>
              </div>
              <button
                type="button"
                className={cn(
                  "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-all",
                  status === "completed"
                    ? "primary-gradient text-on-primary-fixed"
                    : "border border-outline-variant/20 bg-surface-container-high text-outline hover:text-primary",
                )}
                onClick={(e) => {
                  e.stopPropagation();
                  setStatus(
                    status === "completed"
                      ? "not_started"
                      : status === "learning"
                        ? "completed"
                        : "learning",
                  );
                }}
              >
                {status === "completed" ? (
                  <CheckCircle2 size={20} />
                ) : status === "learning" ? (
                  <Activity size={20} className="animate-pulse" />
                ) : (
                  <Circle size={20} />
                )}
              </button>
            </div>

            {expanded && (
              <div className="mt-6 animate-in fade-in slide-in-from-top-2 duration-500">
                <p className="mb-6 max-w-2xl text-sm leading-relaxed text-on-surface-variant">
                  {milestone.description}
                </p>

                <div className="mb-6 flex flex-wrap gap-2">
                  {milestone.skills.map((s) => (
                    <Badge key={s} tone="default" className="normal-case tracking-normal">
                      {s}
                    </Badge>
                  ))}
                </div>

                <div className="space-y-3">
                  <h4 className="px-1 text-[10px] font-bold uppercase tracking-widest text-outline">
                    Curated Resources
                  </h4>
                  {milestone.resources.map((res) => {
                    const { icon: Icon, color } = resourceTypeIcon(res.type);
                    return (
                      <a
                        key={res.title}
                        href={res.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group/res flex items-center gap-4 rounded-xl border border-outline-variant/15 bg-surface-container-low p-4 transition-all hover:border-primary/25"
                      >
                        <div
                          className={cn(
                            "flex h-10 w-10 items-center justify-center rounded-xl bg-surface-container",
                            color,
                          )}
                        >
                          <Icon size={18} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="text-sm font-bold text-on-surface group-hover/res:text-primary transition-colors">
                            {res.title}
                          </div>
                          <div className="flex flex-wrap items-center gap-2 text-[10px] text-outline">
                            <span>{res.provider}</span>
                            <span>·</span>
                            <span>{res.estimatedHours}h</span>
                            <span>·</span>
                            <span className={res.isFree ? "text-primary" : "text-secondary"}>
                              {res.isFree ? "FREE" : "PAID"}
                            </span>
                          </div>
                        </div>
                        <ExternalLink
                          size={14}
                          className="shrink-0 text-outline group-hover/res:text-primary transition-colors"
                        />
                      </a>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}

export default function RoadmapPage() {
  const { id } = useParams();
  const [analysis, setAnalysis] = useState<AnalysisData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchAnalysis() {
      const token = getAuthToken();
      if (!token || !id) {
        setLoading(false);
        return;
      }

      try {
        const res = await fetch(`/api/v1/analysis/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json().catch(() => null);
          setAnalysis(data);
        } else {
          setError("Analysis not found");
        }
      } catch {
        setError("Failed to load analysis");
      } finally {
        setLoading(false);
      }
    }
    fetchAnalysis();
  }, [id]);

  const radarData = useMemo(() => {
    if (!analysis?.skillGaps || analysis.skillGaps.length === 0) {
      return [];
    }
    return analysis.skillGaps.slice(0, 6).map((g) => ({
      subject: g.skill,
      A: g.radar_score || 0,
      fullMark: 100,
    }));
  }, [analysis]);

  const milestones: RoadmapMilestone[] = useMemo(() => {
    return (
      (analysis as any)?.roadmap?.steps?.map((step: any, i: number) => ({
        id: `ms_${i + 1}`,
        week: step.week || i + 1,
        title: step.title,
        description: step.description,
        skills: step.skills || [],
        resources: step.resources || [],
        estimatedHours: parseInt(step.estimatedTime) || 10,
        status: "not_started" as const,
      })) || []
    );
  }, [analysis]);

  const missing = analysis?.gapAnalysis?.missingSkills || [];
  const matchPercentage =
    analysis?.gapAnalysis?.matchPercentage ?? analysis?.overall_score ?? 0;

  if (loading) {
    return (
      <PageShell>
        <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-on-surface-variant">Loading analysis...</p>
        </div>
      </PageShell>
    );
  }

  if (error || !analysis) {
    return (
      <PageShell>
        <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 text-center">
          <p className="text-error">{error || "Analysis not found"}</p>
          <Link to="/dashboard" className="text-sm font-bold text-primary hover:underline">
            Go to Dashboard
          </Link>
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell>
      <OnboardingTooltip
        pageKey="roadmap"
        icon="🗺️"
        title="Your personalized upskilling plan"
        description="Milestones are ordered by impact. Complete each to unlock the next. Track progress with the checkboxes."
      />

      <PageHeader
        icon={<Map size={22} />}
        title="Personalized Roadmap"
        description={
          milestones.length > 0
            ? `Your ${milestones.length}-step learning path to bridge the gap and land your target role.`
            : "Complete an analysis to see your personalized roadmap."
        }
        badge={`${analysis.seniority} tier`}
        actions={
          <>
            <Link
              to="/dashboard"
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-outline-variant/20 bg-surface-container-high text-outline transition-all hover:text-primary"
              aria-label="Back to dashboard"
            >
              <ArrowLeft size={18} />
            </Link>
            <Button variant="outline" size="sm">
              <Share2 size={14} /> Share
            </Button>
            <Button size="sm">
              <Download size={14} /> Export
            </Button>
          </>
        }
      />

      <div className="grid gap-8 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          {milestones.length > 0 ? (
            milestones.map((ms, i) => (
              <MilestoneCard key={ms.id} milestone={ms} index={i} />
            ))
          ) : (
            <Card padding="lg" className="text-center">
              <p className="text-on-surface-variant">
                No roadmap generated yet. Run an analysis first.
              </p>
            </Card>
          )}

          {milestones.length > 0 && (
            <Card padding="lg" className="relative overflow-hidden border-primary/25 bg-primary/5 text-center">
              <div className="pointer-events-none absolute inset-0 primary-gradient opacity-5" />
              <div className="relative z-10 flex flex-col items-center">
                <Award className="mb-4 text-primary" size={48} />
                <h3 className="mb-2 text-2xl font-bold text-on-surface">Certification Project</h3>
                <p className="mb-6 max-w-md text-sm text-on-surface-variant">
                  Complete a project implementing these skills to validate your roadmap.
                </p>
                <Button>Initialize Capstone</Button>
              </div>
            </Card>
          )}
        </div>

        <aside className="space-y-6">
          <Card padding="lg" className="relative overflow-hidden text-center">
            <div className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full primary-gradient opacity-10 blur-3xl" />
            <p className="mb-4 text-[10px] font-bold uppercase tracking-widest text-outline">
              Aggregate Match
            </p>
            <div className="mb-2 text-5xl font-black tracking-tight text-primary">
              {matchPercentage}%
            </div>
            <Badge tone="primary" className="mb-8">
              {analysis.seniority} Tier
            </Badge>

            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-xl border border-outline-variant/15 bg-surface-container-low p-4">
                <div className="text-xl font-black text-on-surface">
                  {analysis.resume_strength_score ?? "-"}%
                </div>
                <div className="text-[10px] font-bold uppercase text-outline">Resume</div>
              </div>
              <div className="rounded-xl border border-outline-variant/15 bg-surface-container-low p-4">
                <div className="text-xl font-black text-on-surface">
                  {analysis.ats_score ?? "-"}%
                </div>
                <div className="text-[10px] font-bold uppercase text-outline">ATS Opt</div>
              </div>
            </div>
          </Card>

          <Card padding="lg">
            <h3 className="mb-4 flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-outline">
              <TrendingUp size={16} className="text-primary" />
              Category Coverage
            </h3>
            <div className="h-[280px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={radarData}>
                  <PolarGrid stroke="rgba(148,163,184,0.15)" />
                  <PolarAngleAxis
                    dataKey="subject"
                    tick={{
                      fill: "rgb(148 163 184)",
                      fontSize: 10,
                      fontWeight: 700,
                    }}
                  />
                  <Radar
                    name="Expertise"
                    dataKey="A"
                    stroke="rgb(176 162 255)"
                    fill="rgb(176 162 255)"
                    fillOpacity={0.15}
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

          <Card padding="lg">
            <h3 className="mb-4 flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-outline">
              <Activity size={16} className="text-tertiary" />
              Skill Gap Inventory
            </h3>
            <p className="mb-3 text-[10px] font-bold uppercase tracking-widest text-outline">
              Missing Skills
            </p>
            <div className="space-y-2">
              {missing.length > 0 ? (
                missing.map((skill: string, idx: number) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between rounded-xl border border-outline-variant/15 bg-surface-container-low p-3"
                  >
                    <div className="flex items-center gap-2">
                      <div className="h-1.5 w-1.5 rounded-full bg-error" />
                      <span className="text-xs font-bold text-on-surface">{skill}</span>
                    </div>
                    <Badge tone="error">Gap</Badge>
                  </div>
                ))
              ) : (
                <p className="py-2 text-center text-xs text-on-surface-variant">
                  No gaps identified
                </p>
              )}
            </div>
          </Card>
        </aside>
      </div>
    </PageShell>
  );
}
