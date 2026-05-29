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
import OnboardingTooltip from "@/components/onboarding/OnboardingTooltip";
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
    <PageShell maxWidth="lg">
      <OnboardingTooltip
        pageKey="linkedin"
        icon="🔗"
        title="Optimize your LinkedIn profile"
        description="Get AI-powered suggestions to improve your profile's visibility, headline, and experience section."
      />

      <PageHeader
        title="LinkedIn Profile Optimizer"
        description="Transform your resume into a compelling LinkedIn profile that attracts recruiters"
        icon={<Linkedin size={22} />}
      />

      {error && (
        <Card className="mb-6 border-error/30 bg-error/10" padding="md">
          <div className="flex items-start gap-3">
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-error" />
            <div className="flex-1">
              <p className="font-medium text-error">Error</p>
              <p className="text-sm text-error/80">{error}</p>
            </div>
            <button
              type="button"
              onClick={() => setError(null)}
              className="text-error/60 hover:text-error"
            >
              <X size={16} />
            </button>
          </div>
        </Card>
      )}

      <Card className="mb-6" padding="lg">
        <h2 className="mb-4 flex items-center gap-2 text-lg font-bold text-on-surface">
          <FileText className="h-5 w-5 text-primary" />
          Your resume
        </h2>

        <div className="mb-2 flex items-center justify-between">
          <span className="text-sm font-medium text-on-surface-variant">
            Resume text *
          </span>
          <label className="flex cursor-pointer items-center gap-1 text-sm text-primary hover:underline">
            <Upload size={14} />
            Upload file
            <input
              type="file"
              accept=".txt,.pdf,.doc,.docx"
              onChange={handleFileUpload}
              className="hidden"
            />
          </label>
        </div>
        <Textarea
          value={resumeText}
          onChange={(e) => setResumeText(e.target.value)}
          placeholder="Paste your resume content here..."
          rows={8}
        />

        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input
            label="Target role"
            type="text"
            value={targetRole}
            onChange={(e) => setTargetRole(e.target.value)}
            placeholder="e.g., Senior Software Engineer"
          />
          <Input
            label="Industry"
            type="text"
            value={industry}
            onChange={(e) => setIndustry(e.target.value)}
            placeholder="e.g., Technology, Finance"
          />
        </div>

        <Button
          onClick={handleOptimize}
          disabled={loading || !resumeText.trim()}
          loading={loading}
          className="mt-4 w-full"
          size="lg"
        >
          {loading ? (
            <>
              <RefreshCw className="h-5 w-5 animate-spin" />
              Optimizing...
            </>
          ) : (
            <>
              <Sparkles className="h-5 w-5" />
              Optimize LinkedIn profile
            </>
          )}
        </Button>
      </Card>

      {optimized && (
        <div className="space-y-6">
          <Card>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="flex items-center gap-2 text-lg font-bold text-on-surface">
                <Target className="h-5 w-5 text-primary" />
                Optimized headline
              </h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleCopy(optimized.headline, "headline")}
              >
                {copiedSection === "headline" ? (
                  <Check className="h-5 w-5 text-emerald-400" />
                ) : (
                  <Copy className="h-5 w-5" />
                )}
              </Button>
            </div>
            <p className="rounded-xl border border-primary/20 bg-primary/5 p-4 font-medium text-on-surface">
              {optimized.headline}
            </p>
            <p className="mt-2 text-xs text-on-surface-variant">
              {optimized.headline.length}/220 characters
            </p>
          </Card>

          <Card>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="flex items-center gap-2 text-lg font-bold text-on-surface">
                <FileText className="h-5 w-5 text-primary" />
                About section
              </h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleCopy(optimized.about, "about")}
              >
                {copiedSection === "about" ? (
                  <Check className="h-5 w-5 text-emerald-400" />
                ) : (
                  <Copy className="h-5 w-5" />
                )}
              </Button>
            </div>
            <p className="whitespace-pre-wrap rounded-xl border border-outline-variant/15 bg-surface-container-high p-4 leading-relaxed text-on-surface-variant">
              {optimized.about}
            </p>
            <p className="mt-2 text-xs text-on-surface-variant">
              {optimized.about.length}/2600 characters
            </p>
          </Card>

          {optimized.experienceBullets?.length > 0 && (
            <Card>
              <h2 className="mb-4 flex items-center gap-2 text-lg font-bold text-on-surface">
                <TrendingUp className="h-5 w-5 text-primary" />
                Experience bullets
              </h2>
              <div className="space-y-4">
                {optimized.experienceBullets.map((exp: any, i: number) => (
                  <div
                    key={i}
                    className="rounded-xl border border-outline-variant/15 bg-surface-container-high p-4"
                  >
                    <h3 className="mb-2 font-medium text-on-surface">{exp.role}</h3>
                    <ul className="space-y-2">
                      {exp.bullets.map((bullet: string, j: number) => (
                        <li
                          key={j}
                          className="flex items-start gap-2 text-sm text-on-surface-variant"
                        >
                          <ChevronRight className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                          {bullet}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {optimized.skills?.length > 0 && (
            <Card>
              <h2 className="mb-4 flex items-center gap-2 text-lg font-bold text-on-surface">
                <Sparkles className="h-5 w-5 text-primary" />
                Top skills to highlight
              </h2>
              <div className="flex flex-wrap gap-2">
                {optimized.skills.map((skill: string) => (
                  <Badge key={skill} tone="primary" className="normal-case tracking-normal">
                    {skill}
                  </Badge>
                ))}
              </div>
            </Card>
          )}

          {optimized.recommendations?.length > 0 && (
            <Card>
              <h2 className="mb-4 flex items-center gap-2 text-lg font-bold text-on-surface">
                <Lightbulb className="h-5 w-5 text-amber-400" />
                Optimization tips
              </h2>
              <ul className="space-y-3">
                {optimized.recommendations.map((rec: string, i: number) => (
                  <li key={i} className="flex items-start gap-3 text-on-surface-variant">
                    <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-amber-500/15 text-xs font-bold text-amber-400">
                      {i + 1}
                    </div>
                    {rec}
                  </li>
                ))}
              </ul>
            </Card>
          )}
        </div>
      )}

      {!optimized && !loading && resumeText.trim() === "" && (
        <EmptyState
          icon={<Linkedin size={28} />}
          title="Ready to optimize"
          description="Paste your resume above and run the optimizer to get LinkedIn-ready copy"
        />
      )}
    </PageShell>
  );
}
