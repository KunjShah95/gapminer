import { useState, useEffect } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
} from "recharts";
import {
  Users,
  TrendingUp,
  Award,
  Target,
  ArrowUpRight,
  ArrowDownRight,
  Zap,
  Brain,
  ChevronRight,
  AlertCircle,
} from "lucide-react";
import { getAuthToken } from "@/lib/authFetch";
import { useAuthStore } from "@/stores/authStore";

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
        const data = await res.json();
        setBenchmark(data);
      }
    } catch (err) {
      setError("Failed to load benchmark data");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-gray-600">Loading benchmark data...</p>
        </div>
      </div>
    );
  }

  if (!benchmark) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">
            No benchmark data available. Run an analysis first.
          </p>
        </div>
      </div>
    );
  }

  const radarData = [
    { subject: "Your Score", value: benchmark.yourScore, fullMark: 100 },
    { subject: "Peer Average", value: benchmark.avgPeerScore, fullMark: 100 },
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <Users className="w-8 h-8 text-blue-600" />
            Peer Benchmarking
          </h1>
          <p className="text-gray-600 mt-1">
            See how your profile compares against other professionals
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-500" />
            <p className="text-red-700">{error}</p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-white p-6 rounded-xl border border-gray-200">
            <div className="flex items-center gap-2 text-gray-600 mb-2">
              <Target size={18} />
              <span className="text-sm">Your Percentile</span>
            </div>
            <p className="text-4xl font-bold text-blue-600">
              {benchmark.percentile}%
            </p>
            <p className="text-sm text-gray-500 mt-1">
              You score higher than {benchmark.percentile}% of peers
            </p>
          </div>

          <div className="bg-white p-6 rounded-xl border border-gray-200">
            <div className="flex items-center gap-2 text-gray-600 mb-2">
              <TrendingUp size={18} />
              <span className="text-sm">Score Comparison</span>
            </div>
            <div className="flex items-baseline gap-2">
              <p className="text-4xl font-bold">{benchmark.yourScore}</p>
              <span className="text-gray-500">
                vs {benchmark.avgPeerScore} avg
              </span>
            </div>
            <div
              className={`flex items-center gap-1 mt-1 text-sm ${
                benchmark.yourScore >= benchmark.avgPeerScore
                  ? "text-green-600"
                  : "text-red-600"
              }`}
            >
              {benchmark.yourScore >= benchmark.avgPeerScore ? (
                <ArrowUpRight size={14} />
              ) : (
                <ArrowDownRight size={14} />
              )}
              {Math.abs(benchmark.yourScore - benchmark.avgPeerScore)} pts{" "}
              {benchmark.yourScore >= benchmark.avgPeerScore
                ? "above"
                : "below"}{" "}
              average
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl border border-gray-200">
            <div className="flex items-center gap-2 text-gray-600 mb-2">
              <Users size={18} />
              <span className="text-sm">Peer Pool</span>
            </div>
            <p className="text-4xl font-bold">{benchmark.totalPeers}</p>
            <p className="text-sm text-gray-500 mt-1">
              Profiles compared against
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <div className="bg-white p-6 rounded-xl border border-gray-200">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Target className="w-5 h-5 text-blue-600" />
              Score Comparison
            </h2>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={radarData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="subject" tick={{ fontSize: 12 }} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="value" fill="#3b82f6" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-white p-6 rounded-xl border border-gray-200">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Zap className="w-5 h-5 text-purple-600" />
              Your Advantages
            </h2>
            {benchmark.comparisons && benchmark.comparisons.length > 0 ? (
              <div className="space-y-2">
                {benchmark.comparisons
                  .slice(0, 5)
                  .map((comp: any, i: number) => (
                    <div
                      key={i}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                    >
                      <div className="flex items-center gap-2">
                        <div
                          className={`w-2 h-2 rounded-full ${comp.scoreDiff >= 0 ? "bg-green-500" : "bg-red-500"}`}
                        />
                        <span className="text-sm text-gray-700">
                          {new Date(comp.date).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-xs text-gray-500">
                          {comp.sharedSkills} shared skills
                        </span>
                        <span
                          className={`text-sm font-medium ${comp.scoreDiff >= 0 ? "text-green-600" : "text-red-600"}`}
                        >
                          {comp.scoreDiff >= 0 ? "+" : ""}
                          {comp.scoreDiff}
                        </span>
                      </div>
                    </div>
                  ))}
              </div>
            ) : (
              <p className="text-gray-500 text-sm">
                No comparison data available
              </p>
            )}
          </div>
        </div>

        {benchmark.comparisons &&
          benchmark.comparisons.some(
            (c: any) => c.yourAdvantage && c.yourAdvantage.length > 0,
          ) && (
            <div className="bg-white p-6 rounded-xl border border-gray-200">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Brain className="w-5 h-5 text-blue-600" />
                Skills You Have That Peers Don't
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
                    <span
                      key={skill}
                      className="px-3 py-1.5 bg-green-50 text-green-700 rounded-lg text-sm font-medium border border-green-200"
                    >
                      {skill}
                    </span>
                  ))}
              </div>
            </div>
          )}
      </div>
    </div>
  );
}
