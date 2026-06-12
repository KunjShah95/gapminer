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
  Flame,
  Zap,
  ArrowDownRight,
  Globe,
  AlertCircle,
  RefreshCw,
  BarChart3,
  Info,
  Loader2,
  DollarSign,
  Briefcase,
  Radio,
} from "lucide-react";
import { getAuthToken } from "@/lib/authFetch";
import DataSourceBadge from "@/components/market/DataSourceBadge";
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

type TrendRow = {
  skill: string;
  category?: string;
  trend: string;
  trendDirection?: string;
  demandScore: number;
  growthRate?: number;
  source?: string;
  liveJobCount?: number;
  salaryMin?: number;
  salaryMedian?: number;
  salaryMax?: number;
  dataSource?: string;
};

const CHART_GRID = "rgba(148, 163, 184, 0.12)";
const CHART_TICK = { fill: "rgb(148 163 184)", fontSize: 11 };

function normalizeTrendFilter(t: TrendRow): "emerging" | "stable" | "declining" {
  const dir = t.trendDirection || t.trend;
  if (dir.includes("emerging") || dir === "emerging") return "emerging";
  if (dir.includes("declining") || dir === "declining") return "declining";
  return "stable";
}

function formatSalary(n: number): string {
  if (!n || n === 0) return "";
  if (n >= 1000) return `$${(n / 1000).toFixed(0)}k`;
  return `$${n}`;
}

export default function MarketDemandPage() {
  const [trends, setTrends] = useState<TrendRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dataSource, setDataSource] = useState<string>("");
  const [disclaimer, setDisclaimer] = useState<string>("");

  useEffect(() => {
    fetchTrends();
  }, []);

  const fetchTrends = async () => {
    const token = getAuthToken();
    if (!token) return;

    setLoading(true);
    setError(null);

    try {
      let skillsToAnalyze = [
        "React",
        "TypeScript",
        "Python",
        "AWS",
        "Docker",
        "Kubernetes",
        "Node.js",
        "PostgreSQL",
      ];

      const analysisRes = await fetch("/api/v1/analysis", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (analysisRes.ok) {
        const analyses = await analysisRes.json();
        if (analyses.length > 0) {
          const detailRes = await fetch(`/api/v1/analysis/${analyses[0].id}`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (detailRes.ok) {
            const detail = await detailRes.json();
            const matched = detail.gapAnalysis?.matchedSkills || [];
            const missing = detail.gapAnalysis?.missingSkills || [];
            const combined = [...matched, ...missing];
            if (combined.length >= 4) {
              skillsToAnalyze = combined.slice(0, 20);
            }
          }
        }
      }

      const skillsParam = encodeURIComponent(skillsToAnalyze.join(","));
      const trendRes = await fetch(
        `/api/v1/skills-trend/trends?skills=${skillsParam}&timeframe=12`,
        { headers: { Authorization: `Bearer ${token}` } },
      );

      if (trendRes.ok) {
        const data = await trendRes.json();
        const rows: TrendRow[] = (data.skills || []).map((s: TrendRow) => ({
          skill: s.skill,
          category: s.category,
          trend: s.trend,
          trendDirection: s.trend,
          demandScore: s.demandScore,
          growthRate: s.growthRate,
          source: s.source,
          liveJobCount: s.liveJobCount ?? 0,
          salaryMin: s.salaryMin ?? 0,
          salaryMedian: s.salaryMedian ?? 0,
          salaryMax: s.salaryMax ?? 0,
          dataSource: s.dataSource,
        }));
        setTrends(rows);
        setDataSource(data.dataSource || "catalog+database");

        const hasLive = rows.some(r => r.liveJobCount > 0);
        setDisclaimer(
          hasLive
            ? "Live job posting counts from Adzuna — updated every 6 hours."
            : "Scores use the curated skill catalog and taxonomy — not live job-board feeds.",
        );
        return;
      }

      const res = await fetch("/api/v1/transformers/market-trends", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ skills: skillsToAnalyze }),
      });

      if (res.ok) {
        const data = await res.json();
        setTrends(data.trends || []);
        setDataSource(data.dataSource || "");
        setDisclaimer(data.disclaimer || "");
      } else {
        setError("Failed to load market trends");
      }
    } catch {
      setError("Failed to load market trends");
    } finally {
      setLoading(false);
    }
  };

  const hotSkills = trends
    .filter((t) => t.demandScore >= 70)
    .sort((a, b) => b.demandScore - a.demandScore);
  const emergingSkills = trends.filter(
    (t) => normalizeTrendFilter(t) === "emerging",
  );
  const decliningSkills = trends.filter(
    (t) => normalizeTrendFilter(t) === "declining",
  );

  const avgDemand =
    trends.length > 0
      ? Math.round(
          trends.reduce((sum, t) => sum + t.demandScore, 0) / trends.length,
        )
      : 0;

  const totalLiveJobs = trends.reduce((sum, t) => sum + (t.liveJobCount || 0), 0);

  const chartData = trends
    .sort((a, b) => b.demandScore - a.demandScore)
    .slice(0, 10)
    .map((t) => ({
      skill: t.skill,
      demand: t.demandScore,
    }));

  return (
    <PageShell maxWidth="2xl">
      <PageHeader
        title="Market Demand Dashboard"
        description="Skill demand from catalog, taxonomy, embedding signals, and live job boards"
        icon={<Globe size={22} />}
        actions={
          <Button
            variant="outline"
            size="sm"
            onClick={fetchTrends}
            disabled={loading}
          >
            <RefreshCw size={16} className={cn(loading && "animate-spin")} />
            Refresh
          </Button>
        }
      />

      {disclaimer && (
        <Card className="mb-6 border-primary/25 bg-primary/5" padding="md">
          <div className="flex items-start gap-3">
            <Info className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
            <div>
              <p className="text-sm text-on-surface">{disclaimer}</p>
              {dataSource && (
                <p className="mt-1 text-xs text-on-surface-variant">
                  Engine: {dataSource}
                </p>
              )}
            </div>
          </div>
        </Card>
      )}

      {error && (
        <Card className="mb-6 border-error/30 bg-error/10" padding="md">
          <div className="flex items-center gap-3">
            <AlertCircle className="h-5 w-5 text-error" />
            <p className="text-sm text-error">{error}</p>
          </div>
        </Card>
      )}

      <div className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-5">
        <StatCard label="Avg demand" value={`${avgDemand}%`} icon={<BarChart3 size={18} />} />
        <StatCard
          label="Hot (70%+)"
          value={hotSkills.length}
          sub="High-demand skills"
          icon={<Flame size={18} />}
        />
        <StatCard
          label="Emerging"
          value={emergingSkills.length}
          sub="Growing signals"
          icon={<Zap size={18} />}
        />
        <StatCard
          label="Declining"
          value={decliningSkills.length}
          sub="Cooling demand"
          icon={<ArrowDownRight size={18} />}
        />
        <StatCard
          label="Live job postings"
          value={totalLiveJobs.toLocaleString()}
          sub="From Adzuna"
          icon={<Radio size={18} />}
        />
      </div>

      <div className="mb-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <h2 className="mb-4 flex items-center gap-2 text-lg font-bold text-on-surface">
            <BarChart3 className="h-5 w-5 text-primary" />
            Top skills by demand
          </h2>
          {loading ? (
            <div className="flex h-[300px] items-center justify-center gap-2 text-on-surface-variant">
              <Loader2 className="h-5 w-5 animate-spin text-primary" />
              Loading...
            </div>
          ) : chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke={CHART_GRID} />
                <XAxis type="number" domain={[0, 100]} tick={CHART_TICK} />
                <YAxis
                  type="category"
                  dataKey="skill"
                  tick={CHART_TICK}
                  width={100}
                />
                <Tooltip
                  formatter={(value: number) => [`${value}%`, "Demand"]}
                  contentStyle={{
                    background: "rgb(30 32 40)",
                    border: "1px solid rgba(148,163,184,0.2)",
                    borderRadius: "12px",
                    color: "rgb(226 232 240)",
                  }}
                />
                <Bar dataKey="demand" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <EmptyState
              icon={<BarChart3 size={28} />}
              title="No chart data"
              description="Run an analysis first for personalized skills"
            />
          )}
        </Card>

        <Card>
          <h2 className="mb-4 flex items-center gap-2 text-lg font-bold text-on-surface">
            <Flame className="h-5 w-5 text-error" />
            Hottest skills
          </h2>
          {hotSkills.length > 0 ? (
            <div className="space-y-3">
              {hotSkills.slice(0, 8).map((skill) => (
                <div key={skill.skill} className="flex flex-col gap-1">
                  <div className="flex items-center gap-3">
                    <span className="w-24 truncate text-sm font-medium text-on-surface">
                      {skill.skill}
                    </span>
                    <div className="h-3 flex-1 overflow-hidden rounded-full bg-surface-container-high">
                      <div
                        className="h-full rounded-full primary-gradient"
                        style={{ width: `${skill.demandScore}%` }}
                      />
                    </div>
                    <span className="w-10 text-right text-sm font-bold text-on-surface">
                      {skill.demandScore}%
                    </span>
                    <DataSourceBadge source={skill.source} />
                  </div>
                  {skill.liveJobCount > 0 && (
                    <div className="flex items-center gap-4 pl-28 text-xs text-on-surface-variant">
                      <span className="flex items-center gap-1">
                        <Briefcase size={12} />
                        {skill.liveJobCount} live jobs
                      </span>
                      {skill.salaryMedian > 0 && (
                        <span className="flex items-center gap-1">
                          <DollarSign size={12} />
                          {formatSalary(skill.salaryMedian)} median
                        </span>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-on-surface-variant">No hot skills in this set</p>
          )}
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <h2 className="mb-4 flex items-center gap-2 text-lg font-bold text-on-surface">
            <Zap className="h-5 w-5 text-primary" />
            Emerging
          </h2>
          <div className="space-y-2">
            {emergingSkills.map((skill) => (
              <div
                key={skill.skill}
                className="flex flex-col gap-1 rounded-xl border border-primary/20 bg-primary/5 p-3"
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-on-surface">{skill.skill}</span>
                  <div className="flex items-center gap-2">
                    <DataSourceBadge source={skill.source} />
                    <span className="text-sm font-bold text-primary">{skill.demandScore}%</span>
                  </div>
                </div>
                {skill.liveJobCount > 0 && (
                  <div className="flex items-center gap-4 text-xs text-on-surface-variant">
                    <span className="flex items-center gap-1">
                      <Briefcase size={12} />
                      {skill.liveJobCount} live jobs
                    </span>
                    {skill.salaryMedian > 0 && (
                      <span className="flex items-center gap-1">
                        <DollarSign size={12} />
                        {formatSalary(skill.salaryMedian)} median
                      </span>
                    )}
                  </div>
                )}
              </div>
            ))}
            {emergingSkills.length === 0 && (
              <p className="text-sm text-on-surface-variant">None in current set</p>
            )}
          </div>
        </Card>

        <Card>
          <h2 className="mb-4 flex items-center gap-2 text-lg font-bold text-on-surface">
            <ArrowDownRight className="h-5 w-5 text-error" />
            Declining
          </h2>
          <div className="space-y-2">
            {decliningSkills.map((skill) => (
              <div
                key={skill.skill}
                className="flex flex-col gap-1 rounded-xl border border-error/20 bg-error/5 p-3"
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-on-surface">{skill.skill}</span>
                  <div className="flex items-center gap-2">
                    <DataSourceBadge source={skill.source} />
                    <span className="text-sm font-bold text-error">{skill.demandScore}%</span>
                  </div>
                </div>
                {skill.liveJobCount > 0 && (
                  <div className="flex items-center gap-4 text-xs text-on-surface-variant">
                    <span className="flex items-center gap-1">
                      <Briefcase size={12} />
                      {skill.liveJobCount} live jobs
                    </span>
                    {skill.salaryMedian > 0 && (
                      <span className="flex items-center gap-1">
                        <DollarSign size={12} />
                        {formatSalary(skill.salaryMedian)} median
                      </span>
                    )}
                  </div>
                )}
              </div>
            ))}
            {decliningSkills.length === 0 && (
              <p className="text-sm text-on-surface-variant">None in current set</p>
            )}
          </div>
        </Card>
      </div>
    </PageShell>
  );
}
