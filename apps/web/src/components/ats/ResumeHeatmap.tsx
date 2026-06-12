import { useMemo } from "react";
import { Info, Flame, Thermometer } from "lucide-react";
import { cn } from "@/lib/utils";
import { Card, Badge } from "@/components/ui";

interface HeatmapZone {
  section: string;
  label: string;
  yStart: number;
  yEnd: number;
  attentionScore: number;
  color: string;
  keywordDensity: number;
  keywordHits: number;
  issues: HeatmapIssue[];
}

interface HeatmapIssue {
  type: "parsing" | "keyword_gap" | "formatting" | "density";
  severity: "high" | "medium" | "low";
  message: string;
}

interface HeatmapResult {
  zones: HeatmapZone[];
  overallAttentionScore: number;
  coldZoneCount: number;
  hotZoneCount: number;
  summary: string;
}

interface ResumeHeatmapProps {
  resumeText: string;
  jdKeywords?: string[];
  className?: string;
}

function analyzeResumeHeatmap(
  text: string,
  keywords: string[],
): HeatmapResult {
  const STANDARD_SECTIONS = [
    "summary",
    "experience",
    "education",
    "skills",
    "projects",
    "certifications",
    "publications",
    "languages",
    "interests",
  ];

  const SECTION_WEIGHTS: Record<string, number> = {
    summary: 0.9,
    skills: 1.2,
    experience: 1.5,
    education: 0.6,
    projects: 0.8,
    certifications: 0.7,
    publications: 0.5,
    languages: 0.4,
    interests: 0.3,
  };

  function scoreToColor(score: number): string {
    if (score >= 80) return "#EF4444";
    if (score >= 60) return "#F97316";
    if (score >= 40) return "#FBBF24";
    if (score >= 20) return "#60A5FA";
    return "#3B82F6";
  }

  const lines = text.split("\n");
  const total = lines.length;

  // Detect sections
  const sections: Array<{ label: string; startLine: number; endLine: number }> = [];
  let currentStart = 0;
  let currentLabel = "header";

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim().toLowerCase();
    const matched = STANDARD_SECTIONS.find(
      (s) =>
        line === s ||
        line.startsWith(s) ||
        line.endsWith(s) ||
        line.includes(s),
    );

    if (matched && line.length < 30) {
      if (i > currentStart) {
        sections.push({ label: currentLabel, startLine: currentStart, endLine: i - 1 });
      }
      currentStart = i;
      currentLabel = matched;
    }
  }

  if (lines.length > currentStart) {
    sections.push({ label: currentLabel, startLine: currentStart, endLine: lines.length - 1 });
  }

  const zones: HeatmapZone[] = [];
  let zoneScoresSum = 0;

  for (const section of sections) {
    const sectionLines = lines.slice(section.startLine, section.endLine + 1);
    const sectionText = sectionLines.join("\n").toLowerCase();
    const keywordHits = keywords.filter((kw) => sectionText.includes(kw.toLowerCase())).length;
    const keywordDensity = sectionLines.length > 0
      ? Math.min(1, keywordHits / Math.max(sectionLines.length, 1))
      : 0;

    const yPercentStart = (section.startLine / total) * 100;
    const positionWeight = yPercentStart < 33 ? 1.2 : yPercentStart < 66 ? 1.0 : 0.6;
    const typeWeight = SECTION_WEIGHTS[section.label.toLowerCase()] ?? 0.5;

    const rawScore = 50 + keywordDensity * 25 + (positionWeight - 0.5) * 15 + (typeWeight - 0.5) * 10;
    const attentionScore = Math.round(Math.min(100, Math.max(0, rawScore)));

    const issues: HeatmapIssue[] = [];
    if (keywordDensity === 0 && keywords.length > 0) {
      issues.push({ type: "keyword_gap", severity: "medium", message: "No matching keywords in this section" });
    }
    if (sectionLines.some((l) => l.includes("\t") || l.includes("|"))) {
      issues.push({ type: "parsing", severity: "high", message: "Table/column structure — ATS may misread" });
    }

    zones.push({
      section: section.label,
      label: section.label === "full_resume" ? "Full Resume" : section.label.charAt(0).toUpperCase() + section.label.slice(1),
      yStart: Math.round(yPercentStart),
      yEnd: Math.round(((section.endLine + 1) / total) * 100),
      attentionScore,
      color: scoreToColor(attentionScore),
      keywordDensity: Math.round(keywordDensity * 100) / 100,
      keywordHits,
      issues,
    });

    zoneScoresSum += attentionScore;
  }

  const overallAttentionScore = zones.length > 0 ? Math.round(zoneScoresSum / zones.length) : 50;
  const hotZoneCount = zones.filter((z) => z.attentionScore >= 60).length;
  const coldZoneCount = zones.filter((z) => z.attentionScore < 40).length;

  return {
    zones,
    overallAttentionScore,
    hotZoneCount,
    coldZoneCount,
    summary: overallAttentionScore >= 70
      ? "Strong layout — recruiters will find key information quickly."
      : overallAttentionScore >= 50
        ? "Decent structure — some sections may lose attention. Move key skills higher."
        : "Low attention — consider single-column layout with standard section headers.",
  };
}

function AttentionBar({ score }: { score: number }) {
  const color = score >= 80 ? "bg-red-500" : score >= 60 ? "bg-orange-500" : score >= 40 ? "bg-yellow-500" : "bg-blue-400";
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-surface-container-highest">
      <div
        className={cn("h-full rounded-full transition-all duration-700", color)}
        style={{ width: `${score}%` }}
      />
    </div>
  );
}

export default function ResumeHeatmap({ resumeText, jdKeywords = [], className }: ResumeHeatmapProps) {
  const heatmap = useMemo(
    () => analyzeResumeHeatmap(resumeText, jdKeywords),
    [resumeText, jdKeywords],
  );

  if (!resumeText) {
    return (
      <Card padding="lg" className={cn("text-center", className)}>
        <Thermometer className="mx-auto mb-3 h-8 w-8 text-outline opacity-40" />
        <p className="text-sm text-on-surface-variant">
          Paste a resume above to see the attention heatmap
        </p>
      </Card>
    );
  }

  return (
    <div className={cn("space-y-6", className)}>
      {/* Summary */}
      <Card padding="lg" className="relative overflow-hidden">
        <div className="pointer-events-none absolute -right-12 -top-12 h-32 w-32 rounded-full bg-primary/5 blur-3xl" />
        <div className="relative flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10">
              <Flame className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h3 className="font-bold text-on-surface">Attention Heatmap</h3>
              <p className="text-sm text-on-surface-variant">{heatmap.summary}</p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-3xl font-black" style={{ color: heatmap.overallAttentionScore >= 60 ? "#F97316" : "#3B82F6" }}>
              {heatmap.overallAttentionScore}%
            </div>
            <p className="text-xs text-on-surface-variant">Overall attention</p>
          </div>
        </div>
        <div className="mt-4 flex flex-wrap gap-3">
          <Badge tone={heatmap.hotZoneCount > 0 ? "warning" : "default"}>
            {heatmap.hotZoneCount} hot zones
          </Badge>
          <Badge tone={heatmap.coldZoneCount > 0 ? "info" : "default"}>
            {heatmap.coldZoneCount} cold zones
          </Badge>
          <Badge tone="primary">{heatmap.zones.length} sections</Badge>
        </div>
      </Card>

      {/* Zone list */}
      <div className="space-y-2">
        {heatmap.zones.map((zone) => (
          <div
            key={zone.section}
            className="overflow-hidden rounded-xl border border-outline-variant/15 transition-all hover:border-outline-variant/30"
          >
            <div className="flex items-center gap-4 bg-surface-container-low p-4">
              {/* Color indicator */}
              <div
                className="h-14 w-1.5 shrink-0 rounded-full"
                style={{ backgroundColor: zone.color }}
              />
              {/* Info */}
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-on-surface">{zone.label}</span>
                  <span className="text-2xl font-black" style={{ color: zone.color }}>
                    {zone.attentionScore}%
                  </span>
                </div>
                <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-on-surface-variant">
                  <span>Position: {zone.yStart}% – {zone.yEnd}%</span>
                  <span>Keywords: {zone.keywordHits} hit{zone.keywordHits !== 1 ? "s" : ""}</span>
                  {zone.keywordDensity > 0 && (
                    <span>Density: {Math.round(zone.keywordDensity * 100)}%</span>
                  )}
                </div>
              </div>
              {/* Attention bar */}
              <div className="w-24 shrink-0">
                <AttentionBar score={zone.attentionScore} />
              </div>
            </div>
            {/* Issues */}
            {zone.issues.length > 0 && (
              <div className="border-t border-outline-variant/10 bg-surface-container-lowest px-4 py-2">
                {zone.issues.map((issue, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs text-on-surface-variant">
                    <span
                      className={cn(
                        "h-1.5 w-1.5 rounded-full",
                        issue.severity === "high" ? "bg-error" : issue.severity === "medium" ? "bg-warning" : "bg-outline",
                      )}
                    />
                    {issue.message}
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-6 text-[10px] text-on-surface-variant">
        <span className="flex items-center gap-1.5">
          <span className="h-3 w-3 rounded bg-red-500" /> Hot (80-100)
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-3 w-3 rounded bg-orange-500" /> Warm (60-79)
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-3 w-3 rounded bg-yellow-500" /> Neutral (40-59)
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-3 w-3 rounded bg-blue-400" /> Cool (20-39)
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-3 w-3 rounded bg-blue-600" /> Cold (0-19)
        </span>
      </div>
    </div>
  );
}
