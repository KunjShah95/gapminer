/**
 * Resume Heatmap Engine
 *
 * Analyzes resume structure and computes attention zones based on:
 * - Eye-tracking research (F-pattern scanning, 6-second first pass)
 * - Keyword density per section
 * - Section positioning on page
 * - ATS parsing risk factors
 *
 * This runs client-side or server-side — data is returned as zone coordinates
 * that the frontend renders as a color overlay on the resume preview.
 */

export interface HeatmapZone {
  /** Section identifier */
  section: string;
  /** Label displayed on the heatmap */
  label: string;
  /** Vertical position as % from top of page (0-100) */
  yStart: number;
  /** Vertical end position as % from top (0-100) */
  yEnd: number;
  /** Attention score 0-100 */
  attentionScore: number;
  /** Hex color representing attention level */
  color: string;
  /** Keyword density in this section (0-1) */
  keywordDensity: number;
  /** Number of keyword matches in this section */
  keywordHits: number;
  /** Issues detected in this section */
  issues: HeatmapIssue[];
}

export interface HeatmapIssue {
  type: "parsing" | "keyword_gap" | "formatting" | "density";
  severity: "high" | "medium" | "low";
  message: string;
}

export interface HeatmapResult {
  zones: HeatmapZone[];
  overallAttentionScore: number;
  coldZoneCount: number;
  hotZoneCount: number;
  summary: string;
}

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

/**
 * Converts an attention score to a hex color.
 * 0-20: cold blue (#3B82F6)
 * 20-40: cool (#60A5FA)
 * 40-60: neutral warm (#FBBF24)
 * 60-80: warm (#F97316)
 * 80-100: hot (#EF4444)
 */
function scoreToColor(score: number): string {
  if (score >= 80) return "#EF4444"; // red/hot
  if (score >= 60) return "#F97316"; // orange/warm
  if (score >= 40) return "#FBBF24"; // yellow/neutral
  if (score >= 20) return "#60A5FA"; // light blue/cool
  return "#3B82F6"; // blue/cold
}

/**
 * Extract section boundaries from resume text.
 * Returns array of { label, startLine, endLine }.
 */
function detectSections(
  text: string,
): Array<{ label: string; startLine: number; endLine: number }> {
  const lines = text.split("\n");
  const sections: Array<{ label: string; startLine: number; endLine: number }> =
    [];
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
      // Close previous section
      if (i > currentStart) {
        sections.push({
          label: currentLabel,
          startLine: currentStart,
          endLine: i - 1,
        });
      }
      currentStart = i;
      currentLabel = matched;
    }
  }

  // Close final section
  if (lines.length > currentStart) {
    sections.push({
      label: currentLabel,
      startLine: currentStart,
      endLine: lines.length - 1,
    });
  }

  return sections.length > 1
    ? sections
    : [{ label: "full_resume", startLine: 0, endLine: lines.length - 1 }];
}

/**
 * Count keyword matches in a section of text.
 */
function countKeywordHits(text: string, keywords: string[]): number {
  const lower = text.toLowerCase();
  return keywords.filter((kw) => lower.includes(kw.toLowerCase())).length;
}

/**
 * Compute position-based attention multiplier.
 * Top of page = high attention, bottom = low.
 * Based on F-pattern eye-tracking research.
 */
function getPositionWeight(yPercent: number): number {
  // Top third: high attention (1.2x)
  if (yPercent < 33) return 1.2;
  // Middle: moderate (1.0x)
  if (yPercent < 66) return 1.0;
  // Bottom third: low attention (0.6x)
  return 0.6;
}

/**
 * Compute section-type attention multiplier.
 * Experience = high, Skills = keyword magnet, Education = lower.
 */
function getSectionTypeWeight(sectionLabel: string): number {
  return SECTION_WEIGHTS[sectionLabel.toLowerCase()] ?? 0.5;
}

/**
 * Analyze a resume and return heatmap zones.
 * @param resumeText - Full text of the resume
 * @param jdKeywords - Keywords from job description to match
 * @param totalLines - Optional total line count (for PDF page estimation)
 */
export function analyzeResumeHeatmap(
  resumeText: string,
  jdKeywords: string[] = [],
  totalLines?: number,
): HeatmapResult {
  const lines = resumeText.split("\n");
  const total = totalLines || lines.length;
  const sections = detectSections(resumeText);

  const zones: HeatmapZone[] = [];
  let zoneScoresSum = 0;

  for (const section of sections) {
    const sectionLines = lines.slice(section.startLine, section.endLine + 1);
    const sectionText = sectionLines.join("\n");
    const keywordHits = countKeywordHits(sectionText, jdKeywords);
    const keywordDensity =
      sectionLines.length > 0
        ? Math.min(1, keywordHits / Math.max(sectionLines.length, 1))
        : 0;

    const yPercentStart = (section.startLine / total) * 100;
    const yPercentEnd = ((section.endLine + 1) / total) * 100;

    const positionWeight = getPositionWeight(yPercentStart);
    const typeWeight = getSectionTypeWeight(section.label);

    // Base score: 50 + contributions from keyword density, position, type
    const rawScore =
      50 +
      keywordDensity * 25 +
      (positionWeight - 0.5) * 15 +
      (typeWeight - 0.5) * 10;

    const attentionScore = Math.round(Math.min(100, Math.max(0, rawScore)));

    const issues: HeatmapIssue[] = [];

    // Check for issues
    if (keywordDensity === 0 && jdKeywords.length > 0) {
      issues.push({
        type: "keyword_gap",
        severity: "medium",
        message: `No matching keywords found in this section`,
      });
    }

    if (sectionLines.some((l) => l.includes("\t") || l.includes("|"))) {
      issues.push({
        type: "parsing",
        severity: "high",
        message: `Table or column structure detected — ATS parsers may misread`,
      });
    }

    if (section.label === "experience" && sectionLines.length < 3) {
      issues.push({
        type: "density",
        severity: "low",
        message: `Very short section — consider adding more detail`,
      });
    }

    zones.push({
      section: section.label,
      label: formatSectionLabel(section.label),
      yStart: Math.round(yPercentStart),
      yEnd: Math.round(yPercentEnd),
      attentionScore,
      color: scoreToColor(attentionScore),
      keywordDensity: Math.round(keywordDensity * 100) / 100,
      keywordHits,
      issues,
    });

    zoneScoresSum += attentionScore;
  }

  const overallAttentionScore =
    zones.length > 0 ? Math.round(zoneScoresSum / zones.length) : 50;

  const hotZoneCount = zones.filter((z) => z.attentionScore >= 60).length;
  const coldZoneCount = zones.filter((z) => z.attentionScore < 40).length;

  let summary: string;
  if (overallAttentionScore >= 70) {
    summary =
      "Your resume has strong visual hierarchy and keyword alignment. Recruiters will find key information quickly.";
  } else if (overallAttentionScore >= 50) {
    summary =
      "Your resume structure is decent, but some sections may lose recruiter attention. Consider repositioning key skills higher.";
  } else {
    summary =
      "Your resume structure may cause recruiters to miss important details. Try a single-column layout with standard section headers.";
  }

  return {
    zones,
    overallAttentionScore,
    hotZoneCount,
    coldZoneCount,
    summary,
  };
}

function formatSectionLabel(label: string): string {
  if (label === "full_resume") return "Full Resume";
  return label.charAt(0).toUpperCase() + label.slice(1);
}

/**
 * Generate a user-friendly heatmap summary string.
 */
export function generateHeatmapSummary(heatmap: HeatmapResult): string {
  const parts: string[] = [
    `Overall attention score: ${heatmap.overallAttentionScore}/100`,
    `${heatmap.hotZoneCount} high-attention zones, ${heatmap.coldZoneCount} low-attention zones`,
  ];

  const criticalIssues = heatmap.zones.flatMap((z) =>
    z.issues.filter((i) => i.severity === "high"),
  );
  if (criticalIssues.length > 0) {
    parts.push(`${criticalIssues.length} critical parsing risks found`);
  }

  return parts.join(" · ");
}
