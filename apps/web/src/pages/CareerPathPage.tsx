import { useState, useEffect } from "react";
import {
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
} from "recharts";
import {
  TrendingUp,
  Target,
  Map,
  Briefcase,
  AlertCircle,
  Brain,
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
      const analysisRes = await fetch("/api/v1/analysis", {
        headers: { Authorization: `Bearer ${token}` },
      });
      let userSkills = ["JavaScript", "Python", "React", "Node.js"];

      if (analysisRes.ok) {
        const analyses = await analysisRes.json();
        if (analyses.length > 0) {
          const latest = analyses[0];
          const detailRes = await fetch(`/api/v1/analysis/${latest.id}`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (detailRes.ok) {
            const detail = await detailRes.json();
            if (detail.gapAnalysis?.matchedSkills?.length > 0) {
              userSkills = detail.gapAnalysis.matchedSkills;
            }
          }
        }
      }

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
      <PageShell>
        <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-on-surface-variant">Analyzing your career trajectory...</p>
        </div>
      </PageShell>
    );
  }

  if (!predictions) {
    return (
      <PageShell>
        <EmptyState
          icon={<Map size={28} />}
          title="No career path data"
          description="Run an analysis first to generate predictions"
        />
      </PageShell>
    );
  }

  const radarData = predictions.nextRoles.map((role: any) => ({
    role: role.role.split(" ")[0],
    probability: role.probability,
    fullMark: 100,
  }));

  const likelihoodTone = (p: number) =>
    p >= 70 ? "success" : p >= 50 ? "primary" : "default";

  const likelihoodLabel = (p: number) =>
    p >= 70 ? "Likely" : p >= 50 ? "Possible" : "Stretch";

  return (
    <PageShell maxWidth="lg">
      <PageHeader
        title="Career Path Predictor"
        description="AI-powered career trajectory analysis based on your skills and market trends"
        icon={<Map size={22} />}
      />

      {error && (
        <Card className="mb-6 border-error/30 bg-error/10" padding="md">
          <div className="flex items-center gap-3">
            <AlertCircle className="h-5 w-5 text-error" />
            <p className="text-sm text-error">{error}</p>
          </div>
        </Card>
      )}

      <Card className="mb-8" padding="lg">
        <div className="mb-8 flex items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/15 text-primary">
            <Briefcase className="h-8 w-8" />
          </div>
          <div>
            <p className="text-sm text-on-surface-variant">Current role</p>
            <h2 className="text-2xl font-black text-on-surface">{predictions.currentRole}</h2>
          </div>
        </div>

        <div className="relative">
          <div className="absolute bottom-0 left-8 top-0 w-0.5 bg-outline-variant/20" />
          <div className="space-y-6">
            {predictions.nextRoles.map((role: any) => (
              <div key={role.role} className="relative flex items-start gap-6">
                <div
                  className={cn(
                    "z-10 flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl border text-lg font-black",
                    role.probability >= 70 &&
                      "border-emerald-500/30 bg-emerald-500/15 text-emerald-400",
                    role.probability >= 50 &&
                      role.probability < 70 &&
                      "border-primary/30 bg-primary/15 text-primary",
                    role.probability < 50 &&
                      "border-outline-variant/20 bg-surface-container-high text-on-surface-variant",
                  )}
                >
                  {role.probability}%
                </div>
                <Card className="flex-1" hover padding="md">
                  <div className="mb-3 flex items-start justify-between gap-3">
                    <div>
                      <h3 className="font-bold text-on-surface">{role.role}</h3>
                      <p className="mt-1 flex items-center gap-1 text-sm text-on-surface-variant">
                        <Target size={14} />
                        {role.timeline}
                      </p>
                    </div>
                    <Badge tone={likelihoodTone(role.probability)}>
                      {likelihoodLabel(role.probability)}
                    </Badge>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {role.skills.map((skill: string) => (
                      <Badge
                        key={skill}
                        tone="default"
                        className="normal-case tracking-normal"
                      >
                        {skill}
                      </Badge>
                    ))}
                  </div>
                </Card>
              </div>
            ))}
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <h2 className="mb-4 flex items-center gap-2 text-lg font-bold text-on-surface">
            <Brain className="h-5 w-5 text-primary" />
            Skill gaps to bridge
          </h2>
          <div className="space-y-3">
            {Object.entries(predictions.skillGaps).map(
              ([skill, data]: [string, any]) => (
                <div
                  key={skill}
                  className="flex items-center justify-between rounded-xl border border-outline-variant/15 bg-surface-container-high p-3"
                >
                  <div>
                    <p className="text-sm font-medium text-on-surface">{skill}</p>
                    <p className="text-xs text-on-surface-variant">
                      Effort: {data.effort}
                    </p>
                  </div>
                  <Badge
                    tone={
                      data.priority === "high"
                        ? "error"
                        : data.priority === "medium"
                          ? "warning"
                          : "success"
                    }
                  >
                    {data.priority}
                  </Badge>
                </div>
              ),
            )}
          </div>
        </Card>

        <Card>
          <h2 className="mb-4 flex items-center gap-2 text-lg font-bold text-on-surface">
            <TrendingUp className="h-5 w-5 text-primary" />
            Role probability
          </h2>
          <ResponsiveContainer width="100%" height={250}>
            <RadarChart data={radarData}>
              <PolarGrid stroke="rgba(148,163,184,0.2)" />
              <PolarAngleAxis dataKey="role" tick={{ fill: "rgb(148 163 184)", fontSize: 11 }} />
              <PolarRadiusAxis domain={[0, 100]} tick={{ fill: "rgb(148 163 184)", fontSize: 10 }} />
              <Radar
                name="Probability"
                dataKey="probability"
                stroke="hsl(var(--primary))"
                fill="hsl(var(--primary))"
                fillOpacity={0.2}
              />
            </RadarChart>
          </ResponsiveContainer>
        </Card>
      </div>
    </PageShell>
  );
}
