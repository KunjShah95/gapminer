import { useState, useEffect } from "react";
import {
  TrendingUp,
  Search,
  ExternalLink,
  AlertCircle,
  RefreshCw,
  Target,
  Briefcase,
  Loader2,
} from "lucide-react";
import { getAuthToken } from "@/lib/authFetch";
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
    <PageShell maxWidth="lg">
      <PageHeader
        title="Job Recommendations"
        description="AI-matched jobs based on your skills and experience"
        icon={<Briefcase size={22} />}
        actions={
          <Button
            variant="outline"
            size="sm"
            onClick={fetchRecommendations}
            disabled={loading}
          >
            <RefreshCw size={16} className={cn(loading && "animate-spin")} />
            Refresh
          </Button>
        }
      />

      {error && (
        <Card className="mb-6 border-error/30 bg-error/10" padding="md">
          <div className="flex items-center gap-3">
            <AlertCircle className="h-5 w-5 text-error" />
            <p className="text-sm text-error">{error}</p>
          </div>
        </Card>
      )}

      <div className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-3">
        <StatCard
          label="High matches"
          value={highMatch}
          sub="70%+ match score"
          icon={<Target size={18} />}
        />
        <StatCard
          label="Average match"
          value={`${avgScore}%`}
          sub="Across all recommendations"
          icon={<TrendingUp size={18} />}
        />
        <StatCard
          label="Total jobs"
          value={recommendations.length}
          sub="Available positions"
          icon={<Search size={18} />}
        />
      </div>

      <div className="mb-6 flex flex-wrap gap-2">
        {[
          { id: "all", label: "All" },
          { id: "high", label: "High Match (70%+)" },
          { id: "medium", label: "Medium (50-69%)" },
          { id: "low", label: "Low (<50%)" },
        ].map((f) => (
          <Button
            key={f.id}
            size="sm"
            variant={filter === f.id ? "primary" : "outline"}
            onClick={() => setFilter(f.id)}
          >
            {f.label}
          </Button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center gap-2 py-16 text-on-surface-variant">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
          Loading recommendations...
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={<Briefcase size={28} />}
          title="No matching jobs"
          description="Try refreshing or run a resume analysis first"
          action="Refresh"
          onAction={fetchRecommendations}
        />
      ) : (
        <div className="space-y-4">
          {filtered.map((job) => (
            <Card key={job.jobId} hover padding="lg">
              <div className="mb-4 flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="mb-1 flex flex-wrap items-center gap-3">
                    <h3 className="text-lg font-bold text-on-surface">{job.title}</h3>
                    {job.isSaved && <Badge tone="warning">Saved</Badge>}
                  </div>
                  <div className="flex flex-wrap items-center gap-4 text-sm text-on-surface-variant">
                    <span className="flex items-center gap-1">
                      <Briefcase size={14} />
                      {job.company}
                    </span>
                    {job.url && (
                      <a
                        href={job.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-primary hover:underline"
                      >
                        <ExternalLink size={14} />
                        View posting
                      </a>
                    )}
                  </div>
                </div>
                <div
                  className={cn(
                    "rounded-xl border px-4 py-2 text-center",
                    job.matchScore >= 70 && "border-emerald-500/30 bg-emerald-500/10",
                    job.matchScore >= 50 &&
                      job.matchScore < 70 &&
                      "border-amber-500/30 bg-amber-500/10",
                    job.matchScore < 50 && "border-error/30 bg-error/10",
                  )}
                >
                  <p
                    className={cn(
                      "text-2xl font-black",
                      job.matchScore >= 70 && "text-emerald-400",
                      job.matchScore >= 50 && job.matchScore < 70 && "text-amber-400",
                      job.matchScore < 50 && "text-error",
                    )}
                  >
                    {job.matchScore}%
                  </p>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">
                    Match
                  </p>
                </div>
              </div>

              {job.sharedSkills && job.sharedSkills.length > 0 && (
                <div className="mb-3">
                  <p className="mb-1.5 text-xs font-bold uppercase tracking-wider text-outline">
                    Your matching skills
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {job.sharedSkills.map((skill: string) => (
                      <Badge key={skill} tone="success" className="normal-case tracking-normal">
                        {skill}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {job.missingSkills && job.missingSkills.length > 0 && (
                <div>
                  <p className="mb-1.5 text-xs font-bold uppercase tracking-wider text-outline">
                    Skills to learn
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {job.missingSkills.map((skill: string) => (
                      <Badge key={skill} tone="error" className="normal-case tracking-normal">
                        {skill}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </Card>
          ))}
        </div>
      )}
    </PageShell>
  );
}
