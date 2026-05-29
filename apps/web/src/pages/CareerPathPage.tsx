import { useState, useEffect } from "react";
import {
  LineChart,
  Line,
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
  TrendingUp,
  Target,
  ArrowUpRight,
  Map,
  Briefcase,
  Award,
  Zap,
  AlertCircle,
  ChevronRight,
  Brain,
} from "lucide-react";
import { getAuthToken } from "@/lib/authFetch";

export default function CareerPathPage() {
  const [predictions, setPredictions] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchCareerPaths();
  }, []);

  const fetchCareerPaths = async () => {
    const token = getAuthToken();
    if (!token) return;

    try {
      // Fetch user's latest analysis to get their real skills
      const analysisRes = await fetch("/api/v1/analysis", {
        headers: { Authorization: `Bearer ${token}` }
      });
      let userSkills = ["JavaScript", "Python", "React", "Node.js"]; // fallback

      if (analysisRes.ok) {
        const analyses = await analysisRes.json();
        if (analyses.length > 0) {
          // Get skills from the most recent analysis gap data (e.g. matched skills + some missing)
          const latest = analyses[0];
          // We can fetch the detail of the latest analysis to get all skills, or just pass top_gaps for now as a demo if full detail isn't readily available.
          // Let's fetch the detail:
          const detailRes = await fetch(`/api/v1/analysis/${latest.id}`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          if (detailRes.ok) {
            const detail = await detailRes.json();
            if (detail.gapAnalysis?.matchedSkills?.length > 0) {
               userSkills = detail.gapAnalysis.matchedSkills;
            }
          }
        }
      }

      // Fetch career path predictions dynamically using the real skills
      const pathRes = await fetch("/api/v1/transformers/career-path", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          skills: userSkills,
        }),
      });

      if (!pathRes.ok) throw new Error("Failed to fetch career path");
      const pathData = await pathRes.json();

      setPredictions(pathData);
    } catch (err) {
      setError("Failed to load career predictions");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-gray-600">Analyzing your career trajectory...</p>
        </div>
      </div>
    );
  }

  if (!predictions) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">
            No career path data available. Run an analysis first.
          </p>
        </div>
      </div>
    );
  }

  const radarData = predictions.nextRoles.map((role: any) => ({
    role: role.role.split(" ")[0],
    probability: role.probability,
    fullMark: 100,
  }));

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <Map className="w-8 h-8 text-blue-600" />
            Career Path Predictor
          </h1>
          <p className="text-gray-600 mt-1">
            AI-powered career trajectory analysis based on your skills and
            market trends
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-500" />
            <p className="text-red-700">{error}</p>
          </div>
        )}

        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-8">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center">
              <Briefcase className="w-8 h-8 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Current Role</p>
              <h2 className="text-2xl font-bold text-gray-900">
                {predictions.currentRole}
              </h2>
            </div>
          </div>

          <div className="relative">
            <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-gray-200" />
            <div className="space-y-6">
              {predictions.nextRoles.map((role: any, i: number) => (
                <div
                  key={role.role}
                  className="relative flex items-start gap-6"
                >
                  <div
                    className={`w-16 h-16 rounded-full flex items-center justify-center z-10 ${
                      role.probability >= 70
                        ? "bg-green-100 text-green-700"
                        : role.probability >= 50
                          ? "bg-blue-100 text-blue-700"
                          : "bg-gray-100 text-gray-700"
                    }`}
                  >
                    <span className="text-lg font-bold">
                      {role.probability}%
                    </span>
                  </div>
                  <div className="flex-1 bg-white border border-gray-200 rounded-xl p-5 hover:shadow-lg transition-shadow">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="font-semibold text-gray-900">
                          {role.role}
                        </h3>
                        <p className="text-sm text-gray-500 flex items-center gap-1 mt-1">
                          <Target size={14} />
                          {role.timeline}
                        </p>
                      </div>
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium ${
                          role.probability >= 70
                            ? "bg-green-100 text-green-700"
                            : role.probability >= 50
                              ? "bg-blue-100 text-blue-700"
                              : "bg-gray-100 text-gray-700"
                        }`}
                      >
                        {role.probability >= 70
                          ? "Likely"
                          : role.probability >= 50
                            ? "Possible"
                            : "Stretch"}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {role.skills.map((skill: string) => (
                        <span
                          key={skill}
                          className="px-2 py-1 bg-gray-50 text-gray-700 text-xs rounded border border-gray-200"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-xl border border-gray-200">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Brain className="w-5 h-5 text-blue-600" />
              Skill Gaps to Bridge
            </h2>
            <div className="space-y-3">
              {Object.entries(predictions.skillGaps).map(
                ([skill, data]: [string, any]) => (
                  <div
                    key={skill}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <div>
                      <p className="font-medium text-sm text-gray-900">
                        {skill}
                      </p>
                      <p className="text-xs text-gray-500">
                        Effort: {data.effort}
                      </p>
                    </div>
                    <span
                      className={`px-2 py-1 rounded text-xs font-medium ${
                        data.priority === "high"
                          ? "bg-red-100 text-red-700"
                          : data.priority === "medium"
                            ? "bg-yellow-100 text-yellow-700"
                            : "bg-green-100 text-green-700"
                      }`}
                    >
                      {data.priority}
                    </span>
                  </div>
                ),
              )}
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl border border-gray-200">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-blue-600" />
              Role Probability
            </h2>
            <ResponsiveContainer width="100%" height={250}>
              <RadarChart data={radarData}>
                <PolarGrid />
                <PolarAngleAxis dataKey="role" tick={{ fontSize: 11 }} />
                <PolarRadiusAxis domain={[0, 100]} tick={{ fontSize: 10 }} />
                <Radar
                  name="Probability"
                  dataKey="probability"
                  stroke="#3b82f6"
                  fill="#3b82f6"
                  fillOpacity={0.2}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
