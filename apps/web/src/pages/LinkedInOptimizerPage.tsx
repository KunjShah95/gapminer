import { useState } from "react";
import {
  Linkedin,
  Sparkles,
  Copy,
  Check,
  Upload,
  AlertCircle,
  RefreshCw,
  TrendingUp,
  Target,
  Lightbulb,
  FileText,
  ChevronRight,
  X,
} from "lucide-react";
import { getAuthToken } from "@/lib/authFetch";

export default function LinkedInOptimizerPage() {
  const [resumeText, setResumeText] = useState("");
  const [targetRole, setTargetRole] = useState("");
  const [industry, setIndustry] = useState("");
  const [optimized, setOptimized] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copiedSection, setCopiedSection] = useState<string | null>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      setResumeText(text);
    } catch {
      setError("Failed to read file");
    }
  };

  const handleOptimize = async () => {
    if (!resumeText.trim()) {
      setError("Please provide your resume text");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const token = getAuthToken();
      const res = await fetch("/api/v1/linkedin/optimize", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ resumeText, targetRole, industry }),
      });

      if (!res.ok) throw new Error("Failed to optimize");

      const data = await res.json().catch(() => ({ optimized: null }));
      setOptimized(data.optimized);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async (text: string, section: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedSection(section);
    setTimeout(() => setCopiedSection(null), 2000);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <Linkedin className="w-8 h-8 text-blue-600" />
            LinkedIn Profile Optimizer
          </h1>
          <p className="text-gray-600 mt-2">
            Transform your resume into a compelling LinkedIn profile that
            attracts recruiters
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-red-700 font-medium">Error</p>
              <p className="text-red-600 text-sm">{error}</p>
            </div>
            <button
              onClick={() => setError(null)}
              className="text-red-400 hover:text-red-600 ml-auto"
            >
              <X size={16} />
            </button>
          </div>
        )}

        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <FileText className="w-5 h-5 text-blue-600" />
            Your Resume
          </h2>

          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-medium text-gray-700">
              Resume Text *
            </label>
            <label className="text-sm text-blue-600 hover:text-blue-700 cursor-pointer flex items-center gap-1">
              <Upload size={14} />
              Upload File
              <input
                type="file"
                accept=".txt,.pdf,.doc,.docx"
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>
          </div>
          <textarea
            value={resumeText}
            onChange={(e) => setResumeText(e.target.value)}
            placeholder="Paste your resume content here..."
            rows={8}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-y"
          />

          <div className="grid grid-cols-2 gap-4 mt-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Target Role
              </label>
              <input
                type="text"
                value={targetRole}
                onChange={(e) => setTargetRole(e.target.value)}
                placeholder="e.g., Senior Software Engineer"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Industry
              </label>
              <input
                type="text"
                value={industry}
                onChange={(e) => setIndustry(e.target.value)}
                placeholder="e.g., Technology, Finance"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <button
            onClick={handleOptimize}
            disabled={loading || !resumeText.trim()}
            className="w-full mt-4 bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <RefreshCw className="w-5 h-5 animate-spin" />
                Optimizing...
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5" />
                Optimize LinkedIn Profile
              </>
            )}
          </button>
        </div>

        {optimized && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold flex items-center gap-2">
                  <Target className="w-5 h-5 text-blue-600" />
                  Optimized Headline
                </h2>
                <button
                  onClick={() => handleCopy(optimized.headline, "headline")}
                  className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                >
                  {copiedSection === "headline" ? (
                    <Check className="w-5 h-5 text-green-500" />
                  ) : (
                    <Copy className="w-5 h-5" />
                  )}
                </button>
              </div>
              <p className="text-gray-700 bg-blue-50 p-4 rounded-lg font-medium">
                {optimized.headline}
              </p>
              <p className="text-xs text-gray-500 mt-2">
                {optimized.headline.length}/220 characters
              </p>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold flex items-center gap-2">
                  <FileText className="w-5 h-5 text-blue-600" />
                  About Section
                </h2>
                <button
                  onClick={() => handleCopy(optimized.about, "about")}
                  className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                >
                  {copiedSection === "about" ? (
                    <Check className="w-5 h-5 text-green-500" />
                  ) : (
                    <Copy className="w-5 h-5" />
                  )}
                </button>
              </div>
              <p className="text-gray-700 bg-gray-50 p-4 rounded-lg whitespace-pre-wrap leading-relaxed">
                {optimized.about}
              </p>
              <p className="text-xs text-gray-500 mt-2">
                {optimized.about.length}/2600 characters
              </p>
            </div>

            {optimized.experienceBullets &&
              optimized.experienceBullets.length > 0 && (
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                  <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-blue-600" />
                    Experience Bullets
                  </h2>
                  <div className="space-y-4">
                    {optimized.experienceBullets.map((exp: any, i: number) => (
                      <div
                        key={i}
                        className="border border-gray-200 rounded-lg p-4"
                      >
                        <h3 className="font-medium text-gray-900 mb-2">
                          {exp.role}
                        </h3>
                        <ul className="space-y-2">
                          {exp.bullets.map((bullet: string, j: number) => (
                            <li
                              key={j}
                              className="flex items-start gap-2 text-gray-700 text-sm"
                            >
                              <ChevronRight className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                              {bullet}
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                </div>
              )}

            {optimized.skills && optimized.skills.length > 0 && (
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-blue-600" />
                  Top Skills to Highlight
                </h2>
                <div className="flex flex-wrap gap-2">
                  {optimized.skills.map((skill: string, i: number) => (
                    <span
                      key={skill}
                      className="px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg text-sm font-medium border border-blue-200"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {optimized.recommendations &&
              optimized.recommendations.length > 0 && (
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                  <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <Lightbulb className="w-5 h-5 text-yellow-600" />
                    Optimization Tips
                  </h2>
                  <ul className="space-y-3">
                    {optimized.recommendations.map((rec: string, i: number) => (
                      <li
                        key={i}
                        className="flex items-start gap-3 text-gray-700"
                      >
                        <div className="w-6 h-6 rounded-full bg-yellow-100 text-yellow-700 flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">
                          {i + 1}
                        </div>
                        {rec}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
          </div>
        )}
      </div>
    </div>
  );
}
