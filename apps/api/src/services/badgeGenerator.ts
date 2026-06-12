/**
 * Badge Generator — lightweight SVG shield generation for skill badges.
 * Inspired by shields.io. Returns plain SVG strings rendered as <img> tags.
 *
 * Usage:
 *   GET /api/v1/public/badge/skill/react.svg?style=flat&color=primary
 *
 * Returns:
 *   <svg xmlns="..." viewBox="0 0 200 20">...</svg>
 */

export type BadgeStyle = "flat" | "flat-square" | "plastic" | "for-the-badge";
export type BadgeColor =
  | "primary"
  | "success"
  | "warning"
  | "error"
  | "info"
  | "blue"
  | "green"
  | "orange"
  | "red"
  | "purple"
  | "gray";

const COLOR_MAP: Record<BadgeColor, { label: string; bg: string }> = {
  primary: { label: "#fff", bg: "#6C47FF" },
  success: { label: "#fff", bg: "#22C55E" },
  warning: { label: "#1a1a2e", bg: "#F59E0B" },
  error: { label: "#fff", bg: "#EF4444" },
  info: { label: "#fff", bg: "#3B82F6" },
  blue: { label: "#fff", bg: "#2563EB" },
  green: { label: "#fff", bg: "#16A34A" },
  orange: { label: "#1a1a2e", bg: "#EA580C" },
  red: { label: "#fff", bg: "#DC2626" },
  purple: { label: "#fff", bg: "#7C3AED" },
  gray: { label: "#fff", bg: "#64748B" },
};

interface BadgeOptions {
  label: string;
  value: string;
  color?: BadgeColor;
  style?: BadgeStyle;
  labelColor?: string;
  valueColor?: string;
}

function escapeXml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function measureText(text: string, fontSize: number): number {
  // Approximate character width: most chars ~0.6 * fontSize, wide chars ~0.8
  let width = 0;
  for (const ch of text) {
    if (/[A-ZWmw]/.test(ch)) width += 0.7 * fontSize;
    else if (/[il,;.:!']/.test(ch)) width += 0.35 * fontSize;
    else width += 0.55 * fontSize;
  }
  return width + 8; // padding
}

export function generateBadgeSvg(options: BadgeOptions): string {
  const {
    label,
    value,
    color = "primary",
    style = "flat",
    labelColor,
    valueColor,
  } = options;

  const labelBg = labelColor || "#555";
  const valBg = valueColor || COLOR_MAP[color]?.bg || "#6C47FF";
  const valTextColor = COLOR_MAP[color]?.label || "#fff";
  const fontSize = style === "for-the-badge" ? 13 : 11;

  const labelWidth = Math.max(20, measureText(label, fontSize));
  const valueWidth = Math.max(20, measureText(value, fontSize));
  const totalWidth = labelWidth + valueWidth;
  const height = style === "flat-square" || style === "for-the-badge" ? 28 : 20;
  const radius = style === "flat" || style === "plastic" ? 3 : 0;
  const labelX = labelWidth / 2;
  const valueX = labelWidth + valueWidth / 2;

  let shadowFilter = "";
  if (style === "plastic") {
    shadowFilter = `<filter id="s"><feDropShadow dx="0" dy="1" stdDeviation="1" flood-opacity=".3"/></filter>`;
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${totalWidth} ${height}" width="${totalWidth}" height="${height}">
  ${style === "plastic" ? shadowFilter : ""}
  <rect x="0" y="0" width="${labelWidth}" height="${height}" fill="${escapeXml(labelBg)}"${style !== "plastic" ? "" : ' filter="url(#s)"'} rx="${radius}"${style !== "flat" ? "" : ` ry="${radius}"`} />
  <rect x="${labelWidth}" y="0" width="${valueWidth}" height="${height}" fill="${escapeXml(valBg)}"${style !== "plastic" ? "" : ' filter="url(#s)"'} rx="${radius}"${style !== "flat" ? "" : ` ry="${radius}"`} />
  <clipPath id="l"><rect x="0" y="0" width="${labelWidth}" height="${height}" rx="${radius}"${style !== "flat" ? "" : ` ry="${radius}"`}/></clipPath>
  <clipPath id="r"><rect x="${labelWidth}" y="0" width="${valueWidth}" height="${height}" rx="${radius}"${style !== "flat" ? "" : ` ry="${radius}"`}/></clipPath>
  <g clip-path="url(#l)"><rect x="0" y="0" width="${labelWidth}" height="${height}" fill="${escapeXml(labelBg)}"/></g>
  <g clip-path="url(#r)"><rect x="${labelWidth}" y="0" width="${valueWidth}" height="${height}" fill="${escapeXml(valBg)}"/></g>
  <g fill="#fff" text-anchor="middle" font-family="DejaVu Sans,Verdana,Geneva,sans-serif" font-size="${fontSize}">
    <text x="${labelX}" y="${height / 2 + 4}" fill="${escapeXml(COLOR_MAP[color]?.label || "#fff")}">${escapeXml(label)}</text>
    <text x="${valueX}" y="${height / 2 + 4}" fill="${escapeXml(valTextColor)}">${escapeXml(value)}</text>
  </g>
</svg>`;
}

/**
 * Generates an SVG skill demand badge.
 * Example: "React" → label "React", value "94% demand"
 */
export function generateSkillBadge(
  skillName: string,
  demandScore: number,
  style?: BadgeStyle,
): string {
  const color: BadgeColor =
    demandScore >= 80 ? "primary" : demandScore >= 60 ? "warning" : "gray";

  return generateBadgeSvg({
    label: skillName,
    value: `${demandScore}% demand`,
    color,
    style,
    labelColor: "#555",
  });
}

/**
 * Generates an SVG user proficiency badge.
 * Example: "React" + "Advanced" → label "React", value "Advanced"
 */
export function generateProficiencyBadge(
  skillName: string,
  level: string,
  style?: BadgeStyle,
): string {
  const color: BadgeColor =
    level === "Expert"
      ? "purple"
      : level === "Advanced"
        ? "primary"
        : level === "Intermediate"
          ? "blue"
          : "gray";

  return generateBadgeSvg({
    label: skillName,
    value: level,
    color,
    style,
  });
}

/**
 * Generates an SVG analysis score badge for embedding in READMEs.
 */
export function generateAnalysisBadge(
  score: number,
  style?: BadgeStyle,
): string {
  const color: BadgeColor =
    score >= 80 ? "success" : score >= 60 ? "warning" : "error";

  return generateBadgeSvg({
    label: "GapMiner",
    value: `${score}% match`,
    color,
    style,
  });
}
