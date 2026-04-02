import { useState, useEffect } from "react";
import {
  BarChart,
  Bar,
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
  Flame,
  Zap,
  ArrowUpRight,
  ArrowDownRight,
  Globe,
  AlertCircle,
  RefreshCw,
  Target,
  Briefcase,
  BarChart3,
  Award,
  Activity,
} from "lucide-react";
import { getAuthToken } from "@/lib/authFetch";

export default function MarketDemandPage() {
  const [trends, setTrends] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState("all");

  useEffect(() => {
    fetchTrends();
  }, []);

  const fetchTrends = async () => {
    const token = getAuthToken();
    if (!token) return;

    try {
      const res = await fetch("/api/v1/transformers/market-trends", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          skills: [
            "React",
            "TypeScript",
            "Python",
            "AWS",
            "Docker",
            "Kubernetes",
            "Node.js",
            "PostgreSQL",
            "GraphQL",
            "Machine Learning",
            "Rust",
            "Go",
            "Terraform",
            "CI/CD",
            "Microservices",
            "System Design",
          ],
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setTrends(data.trends || []);
      }
    } catch (err) {
      setError("Failed to load market trends");
    } finally {
      setLoading(false);
    }
  };

  const hotSkills = trends
    .filter((t) => t.demandScore >= 70)
    .sort((a, b) => b.demandScore - a.demandScore);
  const emergingSkills = trends.filter(
    (t) => t.trend === "emerging technology" || t.trend === "high demand skill",
  );
  const decliningSkills = trends.filter(
    (t) => t.trend === "declining technology",
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
      trend: t.trend,
    }));

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <Globe className="w-8 h-8 text-blue-600" />
              Market Demand Dashboard
            </h1>
            <p className="text-gray-600 mt-1">
              Real-time skill demand analysis across the tech industry
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

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-500" />
            <p className="text-red-700">{error}</p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white p-5 rounded-xl border border-gray-200">
            <div className="flex items-center gap-2 text-gray-600 mb-2">
              <Activity size={18} />
              <span className="text-sm">Avg Demand</span>
            </div>
            <p className="text-3xl font-bold text-blue-600">{avgDemand}%</p>
            <p className="text-xs text-gray-500 mt-1">
              Across all tracked skills
            </p>
          </div>
          <div className="bg-white p-5 rounded-xl border border-gray-200">
            <div className="flex items-center gap-2 text-green-600 mb-2">
              <Flame size={18} />
              <span className="text-sm">Hot Skills</span>
            </div>
            <p className="text-3xl font-bold text-green-600">
              {hotSkills.length}
            </p>
            <p className="text-xs text-gray-500 mt-1">70%+ demand score</p>
          </div>
          <div className="bg-white p-5 rounded-xl border border-gray-200">
            <div className="flex items-center gap-2 text-purple-600 mb-2">
              <Zap size={18} />
              <span className="text-sm">Emerging</span>
            </div>
            <p className="text-3xl font-bold text-purple-600">
              {emergingSkills.length}
            </p>
            <p className="text-xs text-gray-500 mt-1">Growing demand</p>
          </div>
          <div className="bg-white p-5 rounded-xl border border-gray-200">
            <div className="flex items-center gap-2 text-red-600 mb-2">
              <ArrowDownRight size={18} />
              <span className="text-sm">Declining</span>
            </div>
            <p className="text-3xl font-bold text-red-600">
              {decliningSkills.length}
            </p>
            <p className="text-xs text-gray-500 mt-1">Decreasing demand</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <div className="bg-white p-6 rounded-xl border border-gray-200">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-blue-600" />
              Top Skills by Demand
            </h2>
            {loading ? (
              <div className="h-[300px] flex items-center justify-center text-gray-500">
                Loading...
              </div>
            ) : chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={chartData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis
                    type="number"
                    domain={[0, 100]}
                    tick={{ fontSize: 11 }}
                  />
                  <YAxis
                    type="category"
                    dataKey="skill"
                    tick={{ fontSize: 11 }}
                    width={100}
                  />
                  <Tooltip
                    formatter={(value: number) => [`${value}%`, "Demand"]}
                  />
                  <Bar dataKey="demand" fill="#3b82f6" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-gray-500">
                No data available
              </div>
            )}
          </div>

          <div className="bg-white p-6 rounded-xl border border-gray-200">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Flame className="w-5 h-5 text-red-600" />
              Hottest Skills Right Now
            </h2>
            {loading ? (
              <div className="h-[300px] flex items-center justify-center text-gray-500">
                Loading...
              </div>
            ) : hotSkills.length > 0 ? (
              <div className="space-y-3">
                {hotSkills.slice(0, 8).map((skill) => (
                  <div key={skill.skill} className="flex items-center gap-4">
                    <span className="w-24 text-sm font-medium text-gray-700 truncate">
                      {skill.skill}
                    </span>
                    <div className="flex-1 bg-gray-100 rounded-full h-3 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${
                          skill.demandScore >= 85
                            ? "bg-gradient-to-r from-red-500 to-orange-500"
                            : skill.demandScore >= 70
                              ? "bg-gradient-to-r from-blue-500 to-cyan-500"
                              : "bg-gradient-to-r from-green-500 to-emerald-500"
                        }`}
                        style={{ width: `${skill.demandScore}%` }}
                      />
                    </div>
                    <span className="w-12 text-right text-sm font-bold text-gray-700">
                      {skill.demandScore}%
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-gray-500">
                No hot skills data
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-xl border border-gray-200">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Zap className="w-5 h-5 text-purple-600" />
              Emerging Technologies
            </h2>
            {emergingSkills.length > 0 ? (
              <div className="space-y-2">
                {emergingSkills.map((skill) => (
                  <div
                    key={skill.skill}
                    className="flex items-center justify-between p-3 bg-purple-50 rounded-lg border border-purple-200"
                  >
                    <div className="flex items-center gap-2">
                      <Zap size={16} className="text-purple-600" />
                      <span className="font-medium text-sm">{skill.skill}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-purple-600 bg-purple-100 px-2 py-0.5 rounded">
                        {skill.trend}
                      </span>
                      <span className="text-sm font-bold text-purple-600">
                        {skill.demandScore}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-sm">
                No emerging skills data available
              </p>
            )}
          </div>

          <div className="bg-white p-6 rounded-xl border border-gray-200">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <ArrowDownRight className="w-5 h-5 text-red-600" />
              Declining Technologies
            </h2>
            {decliningSkills.length > 0 ? (
              <div className="space-y-2">
                {decliningSkills.map((skill) => (
                  <div
                    key={skill.skill}
                    className="flex items-center justify-between p-3 bg-red-50 rounded-lg border border-red-200"
                  >
                    <div className="flex items-center gap-2">
                      <ArrowDownRight size={16} className="text-red-600" />
                      <span className="font-medium text-sm">{skill.skill}</span>
                    </div>
                    <span className="text-sm font-bold text-red-600">
                      {skill.demandScore}%
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-sm">
                No declining skills data available
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
