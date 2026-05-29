import { useState, useEffect } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
} from "recharts";
import {
  TrendingUp,
  Award,
  Target,
  Zap,
  Trophy,
  Flame,
  Brain,
  BarChart3,
  ChevronRight,
  Loader2,
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

const CHART_GRID = "rgba(148, 163, 184, 0.12)";
const CHART_TICK = { fill: "rgb(148 163 184)", fontSize: 11 };
const TOOLTIP_STYLE = {
  background: "rgb(30 32 40)",
  border: "1px solid rgba(148,163,184,0.2)",
  borderRadius: "12px",
  color: "rgb(226 232 240)",
};

export default function SkillProgressPage() {
  const { user } = useAuthStore();
  const [progressData, setProgressData] = useState<any>(null);
  const [careerMemory, setCareerMemory] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<"30d" | "90d" | "all">("all");

  useEffect(() => {
    if (!user?.id) return;
    fetchProgress();
  }, [user?.id]);

  const fetchProgress = async () => {
    const token = getAuthToken();
    if (!token || !user?.id) return;

    try {
      const [progressRes, careerRes] = await Promise.all([
        fetch(`/api/v1/progress/${user.id}`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch("/api/v1/career/memory", {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      if (progressRes.ok) {
        const data = await progressRes.json().catch(() => null);
        setProgressData(data);
      }

      if (careerRes.ok) {
        let memory = await careerRes.json().catch(() => null);
        if (!memory?.snapshots?.length) {
          const bf = await fetch("/api/v1/career/backfill", {
            method: "POST",
            headers: { Authorization: `Bearer ${token}` },
          });
          if (bf.ok) {
            const body = await bf.json().catch(() => null);
            memory = body?.memory ?? body;
          }
        }
        setCareerMemory(memory);
      }
    } catch (err) {
      console.error("Failed to fetch progress:", err);
    } finally {
      setLoading(false);
    }
  };

  const filteredProgress = progressData?.progress || [];

  const latestScore =
    filteredProgress[filteredProgress.length - 1]?.overallScore || 0;
  const firstScore = filteredProgress[0]?.overallScore || 0;
  const scoreChange = latestScore - firstScore;

  const latestGaps =
    filteredProgress[filteredProgress.length - 1]?.gapsCount || 0;
  const firstGaps = filteredProgress[0]?.gapsCount || 0;
  const gapsChange = firstGaps - latestGaps;

  const masteredSkills = progressData?.masteredSkills || [];
  const marketTrends = progressData?.marketTrends || [];

  const hotSkills = marketTrends
    .filter((t: any) => t.demandScore > 70)
    .sort((a: any, b: any) => b.demandScore - a.demandScore)
    .slice(0, 5);

  const emergingSkills = marketTrends
    .filter(
      (t: any) =>
        t.trend === "emerging technology" || t.trend === "high demand skill",
    )
    .slice(0, 5);

  if (loading) {
    return (
      <PageShell>
        <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-on-surface-variant">Loading your progress...</p>
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell maxWidth="2xl">
      <PageHeader
        title="Skill Progress Dashboard"
        description="Track your skill growth and gap closure over time"
        icon={<TrendingUp size={22} />}
        actions={
          <div className="flex gap-2">
            {(["30d", "90d", "all"] as const).map((range) => (
              <Button
                key={range}
                size="sm"
                variant={timeRange === range ? "primary" : "outline"}
                onClick={() => setTimeRange(range)}
              >
                {range === "all" ? "All Time" : `Last ${range}`}
              </Button>
            ))}
          </div>
        }
      />

      {careerMemory?.insights && (
        <Card className="mb-8 border-primary/25 bg-primary/5" padding="lg">
          <h2 className="mb-4 flex items-center gap-2 text-lg font-bold text-on-surface">
            <Brain size={20} className="text-primary" />
            Career memory
          </h2>
          <div className="grid grid-cols-1 gap-4 text-sm md:grid-cols-3">
            <div>
              <p className="mb-1 font-medium text-primary">Top strengths</p>
              <p className="text-on-surface-variant">
                {(careerMemory.insights.topStrengths || []).slice(0, 5).join(", ") ||
                  "Run more analyses to build your profile"}
              </p>
            </div>
            <div>
              <p className="mb-1 font-medium text-primary">Improved skills</p>
              <p className="text-on-surface-variant">
                {(careerMemory.insights.improvedSkills || []).join(", ") || "—"}
              </p>
            </div>
            <div>
              <p className="mb-1 font-medium text-primary">Persistent gaps</p>
              <p className="text-on-surface-variant">
                {(careerMemory.insights.persistentGaps || []).join(", ") || "—"}
              </p>
            </div>
          </div>
          {careerMemory.timeline?.length > 1 && (
            <p className="mt-3 text-xs text-on-surface-variant">
              Score change since last analysis:{" "}
              <span
                className={cn(
                  "font-bold",
                  careerMemory.insights.scoreDelta >= 0
                    ? "text-emerald-400"
                    : "text-error",
                )}
              >
                {careerMemory.insights.scoreDelta >= 0 ? "+" : ""}
                {careerMemory.insights.scoreDelta} pts
              </span>
            </p>
          )}
        </Card>
      )}

      <div className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-4">
        <StatCard
          label="Overall score"
          value={`${latestScore}%`}
          sub={`${scoreChange >= 0 ? "+" : ""}${scoreChange} pts`}
          trend={scoreChange >= 0 ? "up" : "down"}
          icon={<TrendingUp size={18} />}
        />
        <StatCard
          label="Skill gaps"
          value={latestGaps}
          sub={`${gapsChange >= 0 ? "-" : "+"}${Math.abs(gapsChange)} gaps`}
          trend={gapsChange >= 0 ? "up" : "down"}
          icon={<Target size={18} />}
        />
        <StatCard
          label="Skills mastered"
          value={masteredSkills.length}
          sub="Consistently present in analyses"
          icon={<Trophy size={18} />}
        />
        <StatCard
          label="Analyses run"
          value={progressData?.totalAnalyses || 0}
          sub="Total completed analyses"
          icon={<BarChart3 size={18} />}
        />
      </div>

      <div className="mb-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <h2 className="mb-4 flex items-center gap-2 text-lg font-bold text-on-surface">
            <TrendingUp size={18} className="text-primary" />
            Score progression
          </h2>
          {filteredProgress.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <AreaChart data={filteredProgress}>
                <CartesianGrid strokeDasharray="3 3" stroke={CHART_GRID} />
                <XAxis
                  dataKey="date"
                  tickFormatter={(d: string) => new Date(d).toLocaleDateString()}
                  tick={CHART_TICK}
                />
                <YAxis domain={[0, 100]} tick={CHART_TICK} />
                <Tooltip
                  labelFormatter={(d: string) => new Date(d).toLocaleDateString()}
                  formatter={(value: number) => [`${value}%`, "Score"]}
                  contentStyle={TOOLTIP_STYLE}
                />
                <Area
                  type="monotone"
                  dataKey="overallScore"
                  stroke="hsl(var(--primary))"
                  fill="hsl(var(--primary))"
                  fillOpacity={0.15}
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <EmptyState
              icon={<TrendingUp size={28} />}
              title="No progress yet"
              description="Run an analysis to start tracking!"
            />
          )}
        </Card>

        <Card>
          <h2 className="mb-4 flex items-center gap-2 text-lg font-bold text-on-surface">
            <Target size={18} className="text-amber-400" />
            Skill gaps over time
          </h2>
          {filteredProgress.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={filteredProgress}>
                <CartesianGrid strokeDasharray="3 3" stroke={CHART_GRID} />
                <XAxis
                  dataKey="date"
                  tickFormatter={(d: string) => new Date(d).toLocaleDateString()}
                  tick={CHART_TICK}
                />
                <YAxis tick={CHART_TICK} />
                <Tooltip
                  labelFormatter={(d: string) => new Date(d).toLocaleDateString()}
                  formatter={(value: number) => [value, "Gaps"]}
                  contentStyle={TOOLTIP_STYLE}
                />
                <Line
                  type="monotone"
                  dataKey="gapsCount"
                  stroke="#f59e0b"
                  strokeWidth={2}
                  dot={{ fill: "#f59e0b", r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <EmptyState
              icon={<Target size={28} />}
              title="No gap data"
              description="Gap trends appear after multiple analyses"
            />
          )}
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card>
          <h2 className="mb-4 flex items-center gap-2 text-lg font-bold text-on-surface">
            <Trophy size={18} className="text-amber-400" />
            Mastered skills
          </h2>
          {masteredSkills.length > 0 ? (
            <div className="space-y-2">
              {masteredSkills.map((skill: string) => (
                <div
                  key={skill}
                  className="flex items-center justify-between rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-3"
                >
                  <div className="flex items-center gap-2">
                    <Award size={16} className="text-emerald-400" />
                    <span className="text-sm font-medium text-on-surface">{skill}</span>
                  </div>
                  <ChevronRight size={14} className="text-emerald-400/60" />
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-on-surface-variant">
              No mastered skills yet. Keep analyzing!
            </p>
          )}
        </Card>

        <Card>
          <h2 className="mb-4 flex items-center gap-2 text-lg font-bold text-on-surface">
            <Flame size={18} className="text-error" />
            Hot skills in demand
          </h2>
          {hotSkills.length > 0 ? (
            <div className="space-y-2">
              {hotSkills.map((trend: any) => (
                <div
                  key={trend.skill}
                  className="flex items-center justify-between rounded-xl border border-error/20 bg-error/5 p-3"
                >
                  <div className="flex items-center gap-2">
                    <Flame size={16} className="text-error" />
                    <span className="text-sm font-medium text-on-surface">{trend.skill}</span>
                  </div>
                  <span className="text-sm font-bold text-error">{trend.demandScore}%</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-on-surface-variant">No market trend data available</p>
          )}
        </Card>

        <Card>
          <h2 className="mb-4 flex items-center gap-2 text-lg font-bold text-on-surface">
            <Zap size={18} className="text-primary" />
            Emerging skills
          </h2>
          {emergingSkills.length > 0 ? (
            <div className="space-y-2">
              {emergingSkills.map((trend: any) => (
                <div
                  key={trend.skill}
                  className="flex items-center justify-between rounded-xl border border-primary/20 bg-primary/5 p-3"
                >
                  <div className="flex items-center gap-2">
                    <Zap size={16} className="text-primary" />
                    <span className="text-sm font-medium text-on-surface">{trend.skill}</span>
                  </div>
                  <Badge tone="primary" className="normal-case tracking-normal">
                    {trend.trend}
                  </Badge>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-on-surface-variant">No emerging skills data available</p>
          )}
        </Card>
      </div>
    </PageShell>
  );
}
