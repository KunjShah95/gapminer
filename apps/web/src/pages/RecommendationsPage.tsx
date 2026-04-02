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
} from "recharts";
import {
  TrendingUp,
  Flame,
  Zap,
  ArrowUpRight,
  ArrowDownRight,
  Search,
  ExternalLink,
  AlertCircle,
  RefreshCw,
  Target,
  Briefcase,
  MapPin,
  DollarSign,
} from "lucide-react";
import { getAuthToken } from "@/lib/authFetch";

export default function RecommendationsPage() {
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    fetchRecommendations();
  }, []);

  const fetchRecommendations = async () => {
    const token = getAuthToken();
    if (!token) return;

    try {
      const res = await fetch("/api/v1/recommendations/recommend", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ resumeText: "" }),
      });
      if (res.ok) {
        const data = await res.json().catch(() => ({ recommendations: [] }));
        setRecommendations(data.recommendations || []);
      }
    } catch (err) {
      setError("Failed to load recommendations");
    } finally {
      setLoading(false);
    }
  };

  const filtered =
    filter === "all"
      ? recommendations
      : filter === "high"
        ? recommendations.filter((r) => r.matchScore >= 70)
        : filter === "medium"
          ? recommendations.filter(
              (r) => r.matchScore >= 50 && r.matchScore < 70,
            )
          : recommendations.filter((r) => r.matchScore < 50);

  const highMatch = recommendations.filter((r) => r.matchScore >= 70).length;
  const avgScore =
    recommendations.length > 0
      ? Math.round(
          recommendations.reduce((sum, r) => sum + r.matchScore, 0) /
            recommendations.length,
        )
      : 0;

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <Briefcase className="w-8 h-8 text-blue-600" />
              Job Recommendations
            </h1>
            <p className="text-gray-600 mt-1">
              AI-matched jobs based on your skills and experience
            </p>
          </div>
          <button
            onClick={fetchRecommendations}
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

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-white p-5 rounded-xl border border-gray-200">
            <div className="flex items-center gap-2 text-gray-600 mb-2">
              <Target size={18} />
              <span className="text-sm">High Matches</span>
            </div>
            <p className="text-3xl font-bold text-green-600">{highMatch}</p>
            <p className="text-xs text-gray-500 mt-1">70%+ match score</p>
          </div>
          <div className="bg-white p-5 rounded-xl border border-gray-200">
            <div className="flex items-center gap-2 text-gray-600 mb-2">
              <TrendingUp size={18} />
              <span className="text-sm">Average Match</span>
            </div>
            <p className="text-3xl font-bold text-blue-600">{avgScore}%</p>
            <p className="text-xs text-gray-500 mt-1">
              Across all recommendations
            </p>
          </div>
          <div className="bg-white p-5 rounded-xl border border-gray-200">
            <div className="flex items-center gap-2 text-gray-600 mb-2">
              <Search size={18} />
              <span className="text-sm">Total Jobs</span>
            </div>
            <p className="text-3xl font-bold">{recommendations.length}</p>
            <p className="text-xs text-gray-500 mt-1">Available positions</p>
          </div>
        </div>

        <div className="flex gap-2 mb-6">
          {[
            { id: "all", label: "All" },
            { id: "high", label: "High Match (70%+)" },
            { id: "medium", label: "Medium (50-69%)" },
            { id: "low", label: "Low (&lt;50%)" },
          ].map((f) => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === f.id
                  ? "bg-blue-600 text-white"
                  : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="text-center py-12 text-gray-500">
            Loading recommendations...
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            No matching jobs found
          </div>
        ) : (
          <div className="space-y-4">
            {filtered.map((job) => (
              <div
                key={job.jobId}
                className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg transition-shadow"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-1">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {job.title}
                      </h3>
                      {job.isSaved && (
                        <span className="px-2 py-0.5 bg-yellow-100 text-yellow-700 text-xs font-medium rounded">
                          Saved
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <span className="flex items-center gap-1">
                        <Briefcase size={14} />
                        {job.company}
                      </span>
                      {job.url && (
                        <a
                          href={job.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 text-blue-600 hover:underline"
                        >
                          <ExternalLink size={14} />
                          View posting
                        </a>
                      )}
                    </div>
                  </div>
                  <div
                    className={`px-4 py-2 rounded-lg text-center ${
                      job.matchScore >= 70
                        ? "bg-green-50 text-green-700"
                        : job.matchScore >= 50
                          ? "bg-yellow-50 text-yellow-700"
                          : "bg-red-50 text-red-700"
                    }`}
                  >
                    <p className="text-2xl font-bold">{job.matchScore}%</p>
                    <p className="text-xs">Match</p>
                  </div>
                </div>

                {job.sharedSkills && job.sharedSkills.length > 0 && (
                  <div className="mb-3">
                    <p className="text-xs font-medium text-gray-500 mb-1">
                      Your matching skills:
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {job.sharedSkills.map((skill: string) => (
                        <span
                          key={skill}
                          className="px-2 py-0.5 bg-green-50 text-green-700 text-xs rounded border border-green-200"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {job.missingSkills && job.missingSkills.length > 0 && (
                  <div>
                    <p className="text-xs font-medium text-gray-500 mb-1">
                      Skills to learn:
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {job.missingSkills.map((skill: string) => (
                        <span
                          key={skill}
                          className="px-2 py-0.5 bg-red-50 text-red-700 text-xs rounded border border-red-200"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
