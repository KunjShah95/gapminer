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
  BarChart,
  Bar,
} from "recharts";
import {
  TrendingUp,
  Award,
  Target,
  Zap,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  Calendar,
  Trophy,
  Flame,
  Brain,
  BarChart3,
  ChevronRight,
} from "lucide-react";
import { getAuthToken } from "@/lib/authFetch";
import { useAuthStore } from "@/stores/authStore";

export default function SkillProgressPage() {
  const { user } = useAuthStore();
  const [progressData, setProgressData] = useState<any>(null);
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
      const res = await fetch(`/api/v1/progress/${user.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json().catch(() => null);
        setProgressData(data);
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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-gray-600">Loading your progress...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Skill Progress Dashboard
            </h1>
            <p className="text-gray-600 mt-1">
              Track your skill growth and gap closure over time
            </p>
          </div>
          <div className="flex gap-2">
            {(["30d", "90d", "all"] as const).map((range) => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  timeRange === range
                    ? "bg-blue-600 text-white"
                    : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50"
                }`}
              >
                {range === "all" ? "All Time" : `Last ${range}`}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white p-5 rounded-xl border border-gray-200">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600">Overall Score</span>
              <TrendingUp size={16} className="text-blue-600" />
            </div>
            <p className="text-3xl font-bold">{latestScore}%</p>
            <div
              className={`flex items-center gap-1 mt-1 text-sm ${scoreChange >= 0 ? "text-green-600" : "text-red-600"}`}
            >
              {scoreChange >= 0 ? (
                <ArrowUpRight size={14} />
              ) : (
                <ArrowDownRight size={14} />
              )}
              {scoreChange >= 0 ? "+" : ""}
              {scoreChange} pts
            </div>
          </div>

          <div className="bg-white p-5 rounded-xl border border-gray-200">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600">Skill Gaps</span>
              <Target size={16} className="text-orange-600" />
            </div>
            <p className="text-3xl font-bold">{latestGaps}</p>
            <div
              className={`flex items-center gap-1 mt-1 text-sm ${gapsChange >= 0 ? "text-green-600" : "text-red-600"}`}
            >
              {gapsChange >= 0 ? (
                <ArrowDownRight size={14} />
              ) : (
                <ArrowUpRight size={14} />
              )}
              {gapsChange >= 0 ? "-" : "+"}
              {Math.abs(gapsChange)} gaps
            </div>
          </div>

          <div className="bg-white p-5 rounded-xl border border-gray-200">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600">Skills Mastered</span>
              <Trophy size={16} className="text-yellow-600" />
            </div>
            <p className="text-3xl font-bold">{masteredSkills.length}</p>
            <p className="text-xs text-gray-500 mt-1">
              Consistently present in analyses
            </p>
          </div>

          <div className="bg-white p-5 rounded-xl border border-gray-200">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600">Analyses Run</span>
              <BarChart3 size={16} className="text-purple-600" />
            </div>
            <p className="text-3xl font-bold">
              {progressData?.totalAnalyses || 0}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              Total completed analyses
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <div className="bg-white p-6 rounded-xl border border-gray-200">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <TrendingUp size={18} className="text-blue-600" />
              Score Progression
            </h2>
            {filteredProgress.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <AreaChart data={filteredProgress}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis
                    dataKey="date"
                    tickFormatter={(d: string) =>
                      new Date(d).toLocaleDateString()
                    }
                    tick={{ fontSize: 11 }}
                  />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
                  <Tooltip
                    labelFormatter={(d: string) =>
                      new Date(d).toLocaleDateString()
                    }
                    formatter={(value: number) => [`${value}%`, "Score"]}
                  />
                  <Area
                    type="monotone"
                    dataKey="overallScore"
                    stroke="#3b82f6"
                    fill="#3b82f6"
                    fillOpacity={0.1}
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[250px] flex items-center justify-center text-gray-500">
                No progress data yet. Run an analysis to start tracking!
              </div>
            )}
          </div>

          <div className="bg-white p-6 rounded-xl border border-gray-200">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Target size={18} className="text-orange-600" />
              Skill Gaps Over Time
            </h2>
            {filteredProgress.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={filteredProgress}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis
                    dataKey="date"
                    tickFormatter={(d: string) =>
                      new Date(d).toLocaleDateString()
                    }
                    tick={{ fontSize: 11 }}
                  />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip
                    labelFormatter={(d: string) =>
                      new Date(d).toLocaleDateString()
                    }
                    formatter={(value: number) => [value, "Gaps"]}
                  />
                  <Line
                    type="monotone"
                    dataKey="gapsCount"
                    stroke="#f97316"
                    strokeWidth={2}
                    dot={{ fill: "#f97316", r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[250px] flex items-center justify-center text-gray-500">
                No gap data available
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-xl border border-gray-200">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Trophy size={18} className="text-yellow-600" />
              Mastered Skills
            </h2>
            {masteredSkills.length > 0 ? (
              <div className="space-y-2">
                {masteredSkills.map((skill: string, i: number) => (
                  <div
                    key={skill}
                    className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200"
                  >
                    <div className="flex items-center gap-2">
                      <Award size={16} className="text-green-600" />
                      <span className="font-medium text-sm">{skill}</span>
                    </div>
                    <ChevronRight size={14} className="text-green-400" />
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-sm">
                No mastered skills yet. Keep analyzing!
              </p>
            )}
          </div>

          <div className="bg-white p-6 rounded-xl border border-gray-200">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Flame size={18} className="text-red-600" />
              Hot Skills in Demand
            </h2>
            {hotSkills.length > 0 ? (
              <div className="space-y-2">
                {hotSkills.map((trend: any) => (
                  <div
                    key={trend.skill}
                    className="flex items-center justify-between p-3 bg-red-50 rounded-lg border border-red-200"
                  >
                    <div className="flex items-center gap-2">
                      <Flame size={16} className="text-red-600" />
                      <span className="font-medium text-sm">{trend.skill}</span>
                    </div>
                    <span className="text-sm font-bold text-red-600">
                      {trend.demandScore}%
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-sm">
                No market trend data available
              </p>
            )}
          </div>

          <div className="bg-white p-6 rounded-xl border border-gray-200">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Zap size={18} className="text-purple-600" />
              Emerging Skills
            </h2>
            {emergingSkills.length > 0 ? (
              <div className="space-y-2">
                {emergingSkills.map((trend: any) => (
                  <div
                    key={trend.skill}
                    className="flex items-center justify-between p-3 bg-purple-50 rounded-lg border border-purple-200"
                  >
                    <div className="flex items-center gap-2">
                      <Zap size={16} className="text-purple-600" />
                      <span className="font-medium text-sm">{trend.skill}</span>
                    </div>
                    <span className="text-xs text-purple-600 bg-purple-100 px-2 py-0.5 rounded">
                      {trend.trend}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-sm">
                No emerging skills data available
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
