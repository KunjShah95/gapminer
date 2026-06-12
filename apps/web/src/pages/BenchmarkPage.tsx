import { useState, useEffect } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import {
  Users,
  TrendingUp,
  Target,
  Zap,
  Brain,
  AlertCircle,
} from "lucide-react";
import { getAuthToken } from "@/lib/authFetch";
import { useAuthStore } from "@/stores/authStore";
import {
  PageShell,
  PageHeader,
  Card,
  Button,
  Badge,
  StatCard,
  EmptyState,
  Input,
  Textarea,
} from "@/components/ui";
import { cn } from "@/lib/utils";
import { AnalysisResultsSkeleton } from "@/components/skeletons/SkeletonPages";

const CHART_GRID = "rgba(148, 163, 184, 0.12)";
const CHART_TICK = { fill: "rgb(148 163 184)", fontSize: 12 };
const TOOLTIP_STYLE = {
  background: "rgb(30 32 40)",
  border: "1px solid rgba(148,163,184,0.2)",
  borderRadius: "12px",
  color: "rgb(226 232 240)",
};

export default function BenchmarkPage() {
  const { user } = useAuthStore();
  const [benchmark, setBenchmark] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user?.id) return;
    fetchBenchmark();
  }, [user?.id]);

  const fetchBenchmark = async () => {
    const token = getAuthToken();
    if (!token) return;

    try {
      const res = await fetch(`/api/v1/benchmark/compare?analysisId=latest`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json().catch(() => null);
        setBenchmark(data);
      }
    } catch (err) {
      setError("Failed to load benchmark data");
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <AnalysisResultsSkeleton />;

  if (!benchmark) {
    return (
      <PageShell>
        <EmptyState
          icon={<Users size={28} />}
          title="No benchmark data"
          description="Run an analysis first to compare against peers"
        />
      </PageShell>
    );
  }

  const radarData = [
    { subject: "Your Score", value: benchmark.yourScore, fullMark: 100 },
    { subject: "Peer Average", value: benchmark.avgPeerScore, fullMark: 100 },
  ];

  const aboveAvg = benchmark.yourScore >= benchmark.avgPeerScore;

  return (
    <PageShell maxWidth="lg">
      <PageHeader
        title="Peer Benchmarking"
        description="See how your profile compares against other professionals"
        icon={<Users size={22} />}
      />

      {error && (
        <Card className="mb-6 border-error/30 bg-error/10" padding="md">
          <div className="flex items-center gap-3">
            <AlertCircle className="h-5 w-5 text-error" />
            <p className="text-sm text-error">{error}</p>
          </div>
        </Card>
      )}

      <div className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-3">
        <StatCard
          label="Your percentile"
          value={`${benchmark.percentile}%`}
          sub={`Higher than ${benchmark.percentile}% of peers`}
          icon={<Target size={18} />}
        />
        <StatCard
          label="Score comparison"
          value={benchmark.yourScore}
          sub={`vs ${benchmark.avgPeerScore} avg · ${Math.abs(benchmark.yourScore - benchmark.avgPeerScore)} pts ${aboveAvg ? "above" : "below"}`}
          trend={aboveAvg ? "up" : "down"}
          icon={<TrendingUp size={18} />}
        />
        <StatCard
          label="Peer pool"
          value={benchmark.totalPeers}
          sub="Profiles compared against"
          icon={<Users size={18} />}
        />
      </div>

      <div className="mb-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <h2 className="mb-4 flex items-center gap-2 text-lg font-bold text-on-surface">
            <Target className="h-5 w-5 text-primary" />
            Score comparison
          </h2>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={radarData}>
              <CartesianGrid strokeDasharray="3 3" stroke={CHART_GRID} />
              <XAxis dataKey="subject" tick={CHART_TICK} />
              <YAxis domain={[0, 100]} tick={CHART_TICK} />
              <Tooltip contentStyle={TOOLTIP_STYLE} />
              <Bar dataKey="value" fill="hsl(var(--primary))" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card>
          <h2 className="mb-4 flex items-center gap-2 text-lg font-bold text-on-surface">
            <Zap className="h-5 w-5 text-primary" />
            Your advantages
          </h2>
          {benchmark.comparisons && benchmark.comparisons.length > 0 ? (
            <div className="space-y-2">
              {benchmark.comparisons.slice(0, 5).map((comp: any, i: number) => (
                <div
                  key={i}
                  className="flex items-center justify-between rounded-xl border border-outline-variant/15 bg-surface-container-high p-3"
                >
                  <div className="flex items-center gap-2">
                    <div
                      className={cn(
                        "h-2 w-2 rounded-full",
                        comp.scoreDiff >= 0 ? "bg-emerald-400" : "bg-error",
                      )}
                    />
                    <span className="text-sm text-on-surface">
                      {new Date(comp.date).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-on-surface-variant">
                      {comp.sharedSkills} shared skills
                    </span>
                    <span
                      className={cn(
                        "text-sm font-bold",
                        comp.scoreDiff >= 0 ? "text-emerald-400" : "text-error",
                      )}
                    >
                      {comp.scoreDiff >= 0 ? "+" : ""}
                      {comp.scoreDiff}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-on-surface-variant">No comparison data available</p>
          )}
        </Card>
      </div>

      {benchmark.comparisons?.some(
        (c: any) => c.yourAdvantage && c.yourAdvantage.length > 0,
      ) && (
        <Card>
          <h2 className="mb-4 flex items-center gap-2 text-lg font-bold text-on-surface">
            <Brain className="h-5 w-5 text-primary" />
            Skills you have that peers don&apos;t
          </h2>
          <div className="flex flex-wrap gap-2">
            {(
              Array.from(
                new Set(
                  benchmark.comparisons
                    .flatMap((c: any) => c.yourAdvantage || [])
                    .filter(Boolean),
                ),
              ) as string[]
            )
              .slice(0, 15)
              .map((skill) => (
                <Badge key={skill} tone="success" className="normal-case tracking-normal">
                  {skill}
                </Badge>
              ))}
          </div>
        </Card>
      )}
    </PageShell>
  );
}
