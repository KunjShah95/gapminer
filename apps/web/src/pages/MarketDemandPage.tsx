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
} from "lucide-react";
import { getAuthToken } from "@/lib/authFetch";
import DataSourceBadge from "@/components/market/DataSourceBadge";

type TrendRow = {
  skill: string;
  category?: string;
  trend: string;
  trendDirection?: string;
  demandScore: number;
  growthRate?: number;
  source?: string;
};

function normalizeTrendFilter(t: TrendRow): "emerging" | "stable" | "declining" {
  const dir = t.trendDirection || t.trend;
  if (dir.includes("emerging") || dir === "emerging") return "emerging";
  if (dir.includes("declining") || dir === "declining") return "declining";
  return "stable";
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
        }));
        setTrends(rows);
        setDataSource(data.dataSource || "catalog+database");
        setDisclaimer(
          "Scores use the curated skill catalog and your taxonomy — not live job-board feeds.",
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

  const chartData = trends
    .sort((a, b) => b.demandScore - a.demandScore)
    .slice(0, 10)
    .map((t) => ({
      skill: t.skill,
      demand: t.demandScore,
    }));

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <Globe className="w-8 h-8 text-blue-600" />
              Market Demand Dashboard
            </h1>
            <p className="text-gray-600 mt-1">
              Skill demand from catalog, taxonomy, and embedding signals
            </p>
          </div>
          <button
            onClick={fetchTrends}
            className="flex items-center gap-2 text-gray-600 hover:text-blue-600"
          >
            <RefreshCw size={18} className={loading ? "animate-spin" : ""} />
            Refresh
          </button>
        </div>

        {disclaimer && (
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg flex items-start gap-3">
            <Info className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm text-blue-900">{disclaimer}</p>
              {dataSource && (
                <p className="text-xs text-blue-700 mt-1">
                  Engine: {dataSource}
                </p>
              )}
            </div>
          </div>
        )}

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-500" />
            <p className="text-red-700">{error}</p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white p-5 rounded-xl border border-gray-200">
            <p className="text-sm text-gray-600 mb-2">Avg demand</p>
            <p className="text-3xl font-bold text-blue-600">{avgDemand}%</p>
          </div>
          <div className="bg-white p-5 rounded-xl border border-gray-200">
            <p className="text-sm text-green-600 mb-2">Hot (70%+)</p>
            <p className="text-3xl font-bold text-green-600">
              {hotSkills.length}
            </p>
          </div>
          <div className="bg-white p-5 rounded-xl border border-gray-200">
            <p className="text-sm text-purple-600 mb-2">Emerging</p>
            <p className="text-3xl font-bold text-purple-600">
              {emergingSkills.length}
            </p>
          </div>
          <div className="bg-white p-5 rounded-xl border border-gray-200">
            <p className="text-sm text-red-600 mb-2">Declining</p>
            <p className="text-3xl font-bold text-red-600">
              {decliningSkills.length}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <div className="bg-white p-6 rounded-xl border border-gray-200">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-blue-600" />
              Top skills by demand
            </h2>
            {loading ? (
              <div className="h-[300px] flex items-center justify-center text-gray-500">
                Loading...
              </div>
            ) : chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={chartData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 11 }} />
                  <YAxis
                    type="category"
                    dataKey="skill"
                    tick={{ fontSize: 11 }}
                    width={100}
                  />
                  <Tooltip formatter={(value: number) => [`${value}%`, "Demand"]} />
                  <Bar dataKey="demand" fill="#3b82f6" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-gray-500">
                No data — run an analysis first for personalized skills
              </div>
            )}
          </div>

          <div className="bg-white p-6 rounded-xl border border-gray-200">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Flame className="w-5 h-5 text-red-600" />
              Hottest skills
            </h2>
            {hotSkills.length > 0 ? (
              <div className="space-y-3">
                {hotSkills.slice(0, 8).map((skill) => (
                  <div key={skill.skill} className="flex items-center gap-3">
                    <span className="w-24 text-sm font-medium truncate">
                      {skill.skill}
                    </span>
                    <div className="flex-1 bg-gray-100 rounded-full h-3">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-blue-500 to-cyan-500"
                        style={{ width: `${skill.demandScore}%` }}
                      />
                    </div>
                    <span className="w-10 text-sm font-bold text-right">
                      {skill.demandScore}%
                    </span>
                    <DataSourceBadge source={skill.source} />
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-sm">No hot skills in this set</p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-xl border border-gray-200">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Zap className="w-5 h-5 text-purple-600" />
              Emerging
            </h2>
            <div className="space-y-2">
              {emergingSkills.map((skill) => (
                <div
                  key={skill.skill}
                  className="flex items-center justify-between p-3 bg-purple-50 rounded-lg border border-purple-200"
                >
                  <span className="font-medium text-sm">{skill.skill}</span>
                  <div className="flex items-center gap-2">
                    <DataSourceBadge source={skill.source} />
                    <span className="text-sm font-bold text-purple-600">
                      {skill.demandScore}%
                    </span>
                  </div>
                </div>
              ))}
              {emergingSkills.length === 0 && (
                <p className="text-gray-500 text-sm">None in current set</p>
              )}
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl border border-gray-200">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <ArrowDownRight className="w-5 h-5 text-red-600" />
              Declining
            </h2>
            <div className="space-y-2">
              {decliningSkills.map((skill) => (
                <div
                  key={skill.skill}
                  className="flex items-center justify-between p-3 bg-red-50 rounded-lg border border-red-200"
                >
                  <span className="font-medium text-sm">{skill.skill}</span>
                  <div className="flex items-center gap-2">
                    <DataSourceBadge source={skill.source} />
                    <span className="text-sm font-bold text-red-600">
                      {skill.demandScore}%
                    </span>
                  </div>
                </div>
              ))}
              {decliningSkills.length === 0 && (
                <p className="text-gray-500 text-sm">None in current set</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
