import { Link, useSearchParams } from "react-router-dom";
import { useAuthStore } from "@/stores/authStore";
import { useOnboardingStore } from "@/stores/onboardingStore";
import OnboardingChecklist from "@/components/onboarding/OnboardingChecklist";
import {
  Clock,
  ArrowRight,
  FileText,
  Zap,
  Plus,
  FileSearch,
  Target,
  Activity,
  History as HistoryIcon,
  Award,
  LayoutDashboard,
  TrendingUp,
  BarChart3,
  Search,
  ChevronRight,
  BookOpen,
  Briefcase,
} from "lucide-react";
import { useEffect, useState, useMemo } from "react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import {
  PageShell,
  PageHeader,
  Card,
  Badge,
  StatCard,
  EmptyState,
  Button,
} from "@/components/ui";
import { cn } from "@/lib/utils";

interface DashboardAnalysis {
  id: string;
  status: string;
  overall_score: number;
  created_at: string;
  job_title?: string;
  company?: string;
}

function ScoreCircle({ score }: { score: number | undefined }) {
  const validScore = score ?? 0;
  const color =
    validScore >= 80
      ? "text-primary"
      : validScore >= 60
        ? "text-tertiary"
        : "text-error";
  const bgColor =
    validScore >= 80
      ? "bg-primary/10"
      : validScore >= 60
        ? "bg-tertiary/10"
        : "bg-error/10";

  return (
    <div
      className={cn(
        "relative flex h-14 w-14 items-center justify-center rounded-full",
        bgColor,
      )}
    >
      <svg className="absolute h-full w-full -rotate-90">
        <circle
          cx="28"
          cy="28"
          r="24"
          fill="none"
          stroke="currentColor"
          strokeWidth="4"
          className="text-surface-container-highest"
        />
        <circle
          cx="28"
          cy="28"
          r="24"
          fill="none"
          stroke="currentColor"
          strokeWidth="4"
          strokeDasharray={2 * Math.PI * 24}
          strokeDashoffset={2 * Math.PI * 24 * (1 - validScore / 100)}
          strokeLinecap="round"
          className={cn(color, "transition-all duration-1000 ease-out")}
        />
      </svg>
      <span className={cn("text-sm font-bold", color)}>{score ?? "-"}</span>
    </div>
  );
}

function statusTone(status: string): "success" | "error" | "primary" {
  if (status === "complete") return "success";
  if (status === "failed") return "error";
  return "primary";
}

export default function Dashboard() {
  const { user } = useAuthStore();
  const [analyses, setAnalyses] = useState<DashboardAnalysis[]>([]);
  const [loading, setLoading] = useState(true);
  const { completeStep } = useOnboardingStore();
  const [searchParams, setSearchParams] = useSearchParams();

  const [statusFilter, setStatusFilter] = useState(searchParams.get("status") || "all");
  const [dateFilter, setDateFilter] = useState(searchParams.get("days") || "all");
  const [textFilter, setTextFilter] = useState(searchParams.get("q") || "");

  const filteredAnalyses = useMemo(() => {
    return analyses.filter((a) => {
      if (statusFilter !== "all" && a.status !== statusFilter) return false;
      if (dateFilter !== "all") {
        const days = parseInt(dateFilter);
        const cutoff = new Date();
        cutoff.setDate(cutoff.getDate() - days);
        if (new Date(a.created_at) < cutoff) return false;
      }
      if (textFilter) {
        const q = textFilter.toLowerCase();
        const title = (a.job_title || "").toLowerCase();
        const company = (a.company || "").toLowerCase();
        if (!title.includes(q) && !company.includes(q)) return false;
      }
      return true;
    });
  }, [analyses, statusFilter, dateFilter, textFilter]);

  const handleFilterChange = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams);
    if (value && value !== "all") {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    setSearchParams(params, { replace: true });
    if (key === "status") setStatusFilter(value);
    if (key === "days") setDateFilter(value);
    if (key === "q") setTextFilter(value);
  };

  const getWeekData = (items: DashboardAnalysis[]) => {
    const weeks: { name: string; count: number }[] = [];
    const now = new Date();
    for (let i = 11; i >= 0; i--) {
      const weekStart = new Date(now);
      weekStart.setDate(weekStart.getDate() - weekStart.getDay() - i * 7 + 1);
      weekStart.setHours(0, 0, 0, 0);
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekEnd.getDate() + 7);
      const label = weekStart.toLocaleDateString("en-US", { month: "short", day: "numeric" });
      const count = items.filter((a) => {
        const d = new Date(a.created_at);
        return d >= weekStart && d < weekEnd;
      }).length;
      weeks.push({ name: label, count });
    }
    return weeks;
  };

  const skillGrowthData = useMemo(() => {
    return [...analyses]
      .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
      .map((a) => ({
        date: new Date(a.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
        score: a.overall_score ?? 0,
      }));
  }, [analyses]);

  const weekData = useMemo(() => getWeekData(analyses), [analyses]);

  useEffect(() => {
    async function fetchAnalyses() {
      const token = useAuthStore.getState().token;
      if (!token) {
        console.error("No token found");
        setLoading(false);
        return;
      }

      try {
        const res = await fetch("/api/v1/analysis", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json().catch(() => []);
          setAnalyses(data);
          if (data.length > 0) completeStep(3);
        }
      } catch (err) {
        console.error("Failed to fetch analyses:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchAnalyses();
  }, []);

  const avgScore =
    analyses.length > 0
      ? Math.round(
          analyses.reduce((a, b) => a + (b.overall_score ?? 0), 0) /
            analyses.length,
        )
      : 0;

  const firstName = user?.name?.split(" ")[0] || "there";

  return (
    <>
      <PageShell>
        <PageHeader
          icon={<LayoutDashboard size={22} />}
          title={`Welcome back, ${firstName}`}
          description="Track your analyses, skill gaps, and learning progress in one place."
          badge="Dashboard"
          actions={
            <Link
              to="/analyze"
              className="inline-flex items-center justify-center gap-2 rounded-xl px-5 py-2.5 text-sm font-bold primary-gradient text-on-primary-fixed shadow-lg shadow-primary/25 transition-all hover:scale-[1.02]"
            >
              <Plus size={18} />
              New Analysis
            </Link>
          }
        />

        <div className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
          <StatCard
            label="Analyses"
            value={analyses.length}
            icon={<Activity size={18} />}
          />
          <StatCard
            label="Avg Match"
            value={`${avgScore}%`}
            icon={<Target size={18} />}
          />
          <StatCard
            label="Complete"
            value={analyses.filter((a) => a.status === "complete").length}
            icon={<Zap size={18} />}
          />
          <StatCard
            label="Plan"
            value={user?.plan?.toUpperCase() || "FREE"}
            icon={<Award size={18} />}
          />
        </div>

        <div className="mb-8 grid grid-cols-1 gap-4 lg:grid-cols-2">
          <Card padding="lg">
            <h3 className="mb-4 flex items-center gap-2 text-lg font-bold text-on-surface">
              <TrendingUp className="text-primary" size={20} />
              Skill Growth
            </h3>
            {skillGrowthData.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <TrendingUp size={32} className="mb-2 text-outline" />
                <p className="text-sm text-on-surface-variant">No skill data yet</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={skillGrowthData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#48474d" strokeOpacity={0.2} />
                  <XAxis dataKey="date" stroke="#76747b" fontSize={11} tickLine={false} />
                  <YAxis domain={[0, 100]} stroke="#76747b" fontSize={11} tickLine={false} />
                  <Tooltip
                    contentStyle={{
                      background: "#1f1f26",
                      border: "1px solid rgba(72,71,77,0.3)",
                      borderRadius: "12px",
                      fontSize: "12px",
                    }}
                    itemStyle={{ color: "#f9f5fd" }}
                  />
                  <Line
                    type="monotone"
                    dataKey="score"
                    stroke="#3B5BDB"
                    strokeWidth={2}
                    dot={{ fill: "#3B5BDB", r: 4 }}
                    name="Proficiency"
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </Card>
          <Card padding="lg">
            <h3 className="mb-4 flex items-center gap-2 text-lg font-bold text-on-surface">
              <BarChart3 className="text-primary" size={20} />
              Analysis History
            </h3>
            {weekData.length === 0 || weekData.every((w) => w.count === 0) ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <BarChart3 size={32} className="mb-2 text-outline" />
                <p className="text-sm text-on-surface-variant">No analysis data yet</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={weekData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#48474d" strokeOpacity={0.2} />
                  <XAxis dataKey="name" stroke="#76747b" fontSize={11} tickLine={false} />
                  <YAxis allowDecimals={false} stroke="#76747b" fontSize={11} tickLine={false} />
                  <Tooltip
                    contentStyle={{
                      background: "#1f1f26",
                      border: "1px solid rgba(72,71,77,0.3)",
                      borderRadius: "12px",
                      fontSize: "12px",
                    }}
                    itemStyle={{ color: "#f9f5fd" }}
                  />
                  <Bar dataKey="count" fill="#3B5BDB" radius={[4, 4, 0, 0]} name="Analyses" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </Card>
        </div>

        <div className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-3">
          <Link to="/analyze" className="group block">
            <Card padding="md" hover className="relative h-full">
              <div className="flex items-start justify-between">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Plus size={20} />
                </div>
                <ChevronRight
                  size={18}
                  className="mt-1 text-outline transition-all group-hover:translate-x-0.5 group-hover:text-primary"
                />
              </div>
              <h4 className="mt-4 font-bold text-on-surface group-hover:text-primary transition-colors">
                New Analysis
              </h4>
              <p className="mt-1 text-xs text-on-surface-variant">
                Upload a resume or job description for AI-powered gap analysis
              </p>
            </Card>
          </Link>
          <Link to="/roadmap" className="group block">
            <Card padding="md" hover className="relative h-full">
              <div className="flex items-start justify-between">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-tertiary/10 text-tertiary">
                  <BookOpen size={20} />
                </div>
                <ChevronRight
                  size={18}
                  className="mt-1 text-outline transition-all group-hover:translate-x-0.5 group-hover:text-primary"
                />
              </div>
              <h4 className="mt-4 font-bold text-on-surface group-hover:text-primary transition-colors">
                View Roadmap
              </h4>
              <p className="mt-1 text-xs text-on-surface-variant">
                Explore your personalized learning roadmap and track progress
              </p>
            </Card>
          </Link>
          <Link to="/resume-builder" className="group block">
            <Card padding="md" hover className="relative h-full">
              <div className="flex items-start justify-between">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400">
                  <FileText size={20} />
                </div>
                <ChevronRight
                  size={18}
                  className="mt-1 text-outline transition-all group-hover:translate-x-0.5 group-hover:text-primary"
                />
              </div>
              <h4 className="mt-4 font-bold text-on-surface group-hover:text-primary transition-colors">
                Resume Builder
              </h4>
              <p className="mt-1 text-xs text-on-surface-variant">
                Build and optimize your resume with ATS-friendly templates
              </p>
            </Card>
          </Link>
        </div>

        <Card padding="lg" className="mb-8 relative overflow-hidden">
          <div className="pointer-events-none absolute -right-20 top-0 h-full w-64 primary-gradient opacity-10 blur-[80px]" />
          <div className="relative z-10 flex flex-col items-start justify-between gap-6 md:flex-row md:items-center">
            <div className="max-w-xl">
              <Badge tone="primary" className="mb-3">
                Analysis Engine
              </Badge>
              <h2 className="mb-2 text-xl font-black tracking-tight text-on-surface">
                Ready for your next analysis?
              </h2>
              <p className="text-sm text-on-surface-variant leading-relaxed">
                Our multi-agent pipeline supports real-time market indexing. Upload your latest resume to see how you rank against today&apos;s top engineering roles.
              </p>
            </div>
            <Link
              to="/analyze"
              className="inline-flex shrink-0 items-center justify-center gap-2 rounded-2xl px-8 py-3.5 text-base font-bold primary-gradient text-on-primary-fixed shadow-lg shadow-primary/25 transition-all hover:scale-[1.02]"
            >
              <Plus size={20} />
              Start New Analysis
            </Link>
          </div>
        </Card>

        <div className="grid gap-8 lg:grid-cols-3">
          <div className="space-y-4 lg:col-span-2">
            <div className="flex items-center justify-between px-1">
              <h3 className="flex items-center gap-2 text-lg font-bold text-on-surface">
                <HistoryIcon className="text-primary" size={20} />
                Analysis History
              </h3>
              <Link
                to="/analyze"
                className="text-xs font-bold text-primary hover:underline"
              >
                View All →
              </Link>
            </div>

            <div className="flex flex-wrap items-center gap-3 px-1">
              <div className="relative flex-1 min-w-[160px]">
                <Search
                  className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-outline"
                  size={16}
                />
                <input
                  type="text"
                  value={textFilter}
                  onChange={(e) => handleFilterChange("q", e.target.value)}
                  placeholder="Search by title or company..."
                  className="gm-input py-2 pl-9 pr-3 text-xs"
                />
              </div>
              <select
                value={statusFilter}
                onChange={(e) => handleFilterChange("status", e.target.value)}
                className="gm-input w-auto py-2 text-xs"
              >
                <option value="all">All Status</option>
                <option value="complete">Completed</option>
                <option value="processing">Processing</option>
                <option value="failed">Failed</option>
              </select>
              <select
                value={dateFilter}
                onChange={(e) => handleFilterChange("days", e.target.value)}
                className="gm-input w-auto py-2 text-xs"
              >
                <option value="all">All Time</option>
                <option value="7">Last 7 Days</option>
                <option value="30">Last 30 Days</option>
                <option value="90">Last 90 Days</option>
              </select>
            </div>

            {loading ? (
              <Card padding="lg" className="text-center">
                <p className="animate-pulse text-on-surface-variant">Loading analyses...</p>
              </Card>
            ) : filteredAnalyses.length === 0 ? (
              <EmptyState
                icon={<HistoryIcon size={24} />}
                title="No analyses yet"
                description="Start your first analysis to see your history and track your progress over time."
                action="Start Analysis"
                onAction={() => window.location.href = "/analyze"}
              />
            ) : (
              filteredAnalyses.map((analysis) => (
                <Card key={analysis.id} padding="md" hover className="group">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex min-w-0 items-center gap-4">
                      <ScoreCircle score={analysis.overall_score} />
                      <div className="min-w-0">
                        <h4 className="truncate font-bold text-on-surface group-hover:text-primary transition-colors">
                          Job Application Analysis
                        </h4>
                        <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-on-surface-variant">
                          <span className="flex items-center gap-1">
                            <Clock size={12} />
                            {new Date(analysis.created_at).toLocaleDateString()}
                          </span>
                          <Badge tone={statusTone(analysis.status)}>{analysis.status}</Badge>
                        </div>
                      </div>
                    </div>
                    {analysis.status === "complete" && (
                      <Link
                        to={`/analysis/${analysis.id}`}
                        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-outline-variant/20 bg-surface-container-high text-on-surface-variant transition-all hover:border-primary/30 hover:bg-primary hover:text-on-primary-fixed"
                      >
                        <ArrowRight size={18} />
                      </Link>
                    )}
                  </div>
                  {analysis.overall_score !== null && (
                    <div className="mt-4 flex items-center justify-between border-t border-outline-variant/10 pt-4 text-sm">
                      <span className="text-on-surface-variant">Match Percentage</span>
                      <span
                        className={cn(
                          "font-bold",
                          (analysis.overall_score ?? 0) >= 80
                            ? "text-primary"
                            : (analysis.overall_score ?? 0) >= 60
                              ? "text-tertiary"
                              : "text-error",
                        )}
                      >
                        {analysis.overall_score}%
                      </span>
                    </div>
                  )}
                </Card>
              ))
            )}
          </div>

          <div className="space-y-6">
            <OnboardingChecklist />

            <Card padding="lg" className="relative overflow-hidden text-center">
              <div className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full primary-gradient opacity-10 blur-3xl" />
              <div className="relative">
                <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-2xl primary-gradient text-3xl font-black text-on-primary-fixed shadow-lg shadow-primary/20">
                  {user?.name?.charAt(0)}
                </div>
                <h4 className="font-bold text-lg text-on-surface">{user?.name}</h4>
                <p className="mb-6 text-sm text-on-surface-variant">
                  {user?.plan?.toUpperCase()} Plan Active
                </p>

                <div className="mb-6 space-y-2 text-left">
                  <div className="flex justify-between text-xs font-bold uppercase tracking-widest text-outline">
                    <span>Analysis Usage</span>
                    <span>
                      {user?.analysesUsed} / {user?.analysesLimit}
                    </span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full border border-outline-variant/10 bg-surface-container">
                    <div
                      className="h-full primary-gradient transition-all duration-1000"
                      style={{
                        width: `${((user?.analysesUsed || 0) / (user?.analysesLimit || 1)) * 100}%`,
                      }}
                    />
                  </div>
                </div>

                <Link
                  to="/profile"
                  className="flex w-full items-center justify-center rounded-xl border border-outline-variant/25 bg-transparent px-5 py-2.5 text-sm font-bold text-on-surface transition-all hover:border-primary/40 hover:bg-primary/5"
                >
                  Manage account
                </Link>
              </div>
            </Card>

            <Card padding="lg">
              <h3 className="mb-4 flex items-center gap-2 font-bold text-on-surface">
                <Zap className="text-error" size={20} />
                Top Skill Gaps
              </h3>
              <div className="space-y-3">
                {loading ? (
                  <div className="h-16 animate-pulse rounded-xl bg-surface-container" />
                ) : analyses.length > 0 && (analyses[0] as Record<string, any>)?.top_gaps?.length > 0 ? (
                  (analyses[0] as Record<string, any>).top_gaps.map((gap: Record<string, any>, i: number) => (
                    <div key={i} className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <div
                          className={cn(
                            "h-2 w-2 rounded-full",
                            gap.severity === "critical"
                              ? "bg-error shadow-[0_0_8px_rgba(255,110,132,0.8)]"
                              : "bg-tertiary",
                          )}
                        />
                        <span className="text-sm font-semibold text-on-surface">{gap.skill}</span>
                      </div>
                      <span className="text-[10px] font-bold uppercase text-outline">
                        {gap.market_demand || 0}% Demand
                      </span>
                    </div>
                  ))
                ) : (
                  <div className="py-4 text-center">
                    <Target size={24} className="mx-auto mb-2 text-outline" />
                    <p className="text-xs text-on-surface-variant">
                      No gaps identified yet. Run an analysis to discover skill gaps.
                    </p>
                  </div>
                )}
              </div>
              {analyses.length > 0 && (
                <Link
                  to={`/roadmap/${analyses[0].id}`}
                  className="mt-4 block text-center text-xs font-bold text-primary hover:underline"
                >
                  Explore Details →
                </Link>
              )}
            </Card>

            <Card padding="lg">
              <h3 className="mb-4 flex items-center gap-2 font-bold text-on-surface">
                <FileText className="text-primary" size={20} />
                Latest Resume
              </h3>
              <div className="flex items-center gap-3 rounded-xl border border-outline-variant/15 bg-surface-container-low p-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <FileSearch size={20} />
                </div>
                <div className="min-w-0 overflow-hidden">
                  <div className="truncate text-xs font-bold text-on-surface">Default Analysis Resume</div>
                  <div className="text-[10px] text-outline">Used in {analyses.length} reports</div>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </PageShell>
    </>
  );
}
