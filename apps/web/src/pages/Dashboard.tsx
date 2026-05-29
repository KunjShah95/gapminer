import { Link } from "react-router-dom";
import { useAuthStore } from "@/stores/authStore";
import { useOnboardingStore } from "@/stores/onboardingStore";
import OnboardingWizard from "@/components/onboarding/OnboardingWizard";
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
} from "lucide-react";
import { useEffect, useState } from "react";
import {
  PageShell,
  PageHeader,
  Card,
  Badge,
  StatCard,
} from "@/components/ui";
import { cn } from "@/lib/utils";

interface DashboardAnalysis {
  id: string;
  status: string;
  overall_score: number;
  created_at: string;
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
  const { wizardCompleted, completeStep } = useOnboardingStore();
  const showWizard = !wizardCompleted && !loading && analyses.length === 0;

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
      <OnboardingWizard open={showWizard} />
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

            {loading ? (
              <Card padding="lg" className="text-center">
                <p className="animate-pulse text-on-surface-variant">Loading analyses...</p>
              </Card>
            ) : analyses.length === 0 ? (
              <Card padding="lg" className="text-center">
                <p className="mb-4 text-on-surface-variant">No analyses yet</p>
                <Link to="/analyze" className="text-sm font-bold text-primary hover:underline">
                  Start your first analysis
                </Link>
              </Card>
            ) : (
              analyses.map((analysis) => (
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
                ) : (analyses[0] as any)?.top_gaps?.length > 0 ? (
                  (analyses[0] as any).top_gaps.map((gap: any, i: number) => (
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
                  <p className="py-2 text-center text-xs text-on-surface-variant">
                    No gaps identified yet.
                  </p>
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
