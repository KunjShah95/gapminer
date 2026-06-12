/**
 * Deterministic skill demand catalog + DB-backed enrichment.
 * Replaces Math.random() in market trend APIs.
 */

import { prisma } from "../core/database.js";
import { predictMarketTrends } from "./transformerModels.js";
import { searchJobs, extractSalaryRange } from "./jobBoardApi.js";
import { getCache, setCache } from "./cacheService.js";

/** @type {Record<string, Array<{ skill: string; baseDemand: number; trend: 'emerging' | 'stable' | 'declining' }>>} */
export const SKILL_CATALOG = {
  "Programming Languages": [
    { skill: "Python", baseDemand: 95, trend: "stable" },
    { skill: "TypeScript", baseDemand: 88, trend: "emerging" },
    { skill: "Rust", baseDemand: 72, trend: "emerging" },
    { skill: "Go", baseDemand: 78, trend: "emerging" },
    { skill: "Java", baseDemand: 85, trend: "stable" },
    { skill: "C++", baseDemand: 75, trend: "stable" },
    { skill: "JavaScript", baseDemand: 92, trend: "stable" },
    { skill: "Kotlin", baseDemand: 70, trend: "emerging" },
    { skill: "Ruby", baseDemand: 62, trend: "declining" },
    { skill: "Swift", baseDemand: 74, trend: "stable" },
  ],
  "Web Frameworks": [
    { skill: "React", baseDemand: 94, trend: "stable" },
    { skill: "Next.js", baseDemand: 85, trend: "emerging" },
    { skill: "Vue.js", baseDemand: 76, trend: "stable" },
    { skill: "Angular", baseDemand: 72, trend: "declining" },
    { skill: "Svelte", baseDemand: 65, trend: "emerging" },
    { skill: "Django", baseDemand: 78, trend: "stable" },
    { skill: "FastAPI", baseDemand: 82, trend: "emerging" },
    { skill: "Node.js", baseDemand: 90, trend: "stable" },
    { skill: "Express", baseDemand: 80, trend: "stable" },
  ],
  "Cloud & DevOps": [
    { skill: "AWS", baseDemand: 93, trend: "stable" },
    { skill: "Kubernetes", baseDemand: 88, trend: "emerging" },
    { skill: "Docker", baseDemand: 90, trend: "stable" },
    { skill: "Terraform", baseDemand: 80, trend: "emerging" },
    { skill: "Azure", baseDemand: 85, trend: "stable" },
    { skill: "GCP", baseDemand: 78, trend: "stable" },
    { skill: "CI/CD", baseDemand: 86, trend: "stable" },
    { skill: "Observability", baseDemand: 84, trend: "emerging" },
    { skill: "Infrastructure as Code", baseDemand: 87, trend: "emerging" },
  ],
  "AI/ML": [
    { skill: "TensorFlow", baseDemand: 82, trend: "emerging" },
    { skill: "PyTorch", baseDemand: 85, trend: "emerging" },
    { skill: "LLMs", baseDemand: 91, trend: "emerging" },
    { skill: "MLOps", baseDemand: 79, trend: "emerging" },
    { skill: "Prompt Engineering", baseDemand: 88, trend: "emerging" },
    { skill: "LangChain", baseDemand: 75, trend: "emerging" },
    { skill: "Machine Learning", baseDemand: 86, trend: "emerging" },
    { skill: "Deep Learning", baseDemand: 80, trend: "emerging" },
  ],
  Data: [
    { skill: "PostgreSQL", baseDemand: 88, trend: "stable" },
    { skill: "MongoDB", baseDemand: 80, trend: "stable" },
    { skill: "Redis", baseDemand: 82, trend: "stable" },
    { skill: "Snowflake", baseDemand: 76, trend: "emerging" },
    { skill: "Apache Spark", baseDemand: 78, trend: "stable" },
    { skill: "ClickHouse", baseDemand: 68, trend: "emerging" },
    { skill: "SQL", baseDemand: 90, trend: "stable" },
  ],
};

/** Deterministic 0–1 float from a string (stable across requests). */
export function hashUnit(input) {
  let h = 2166136261;
  const s = String(input);
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0) / 4294967295;
}

export function growthRateForTrend(trend, skillName) {
  const u = hashUnit(`${skillName}:${trend}:growth`);
  if (trend === "emerging") return Math.round((15 + u * 20) * 10) / 10;
  if (trend === "declining") return Math.round((-(10 + u * 15)) * 10) / 10;
  return Math.round((-5 + u * 10) * 10) / 10;
}

/**
 * 12-month deterministic demand series for charts.
 */
export function generateSkillTrendData(skillName, trend, demandScore) {
  const months = [];
  const baseDate = new Date();

  for (let i = 11; i >= 0; i--) {
    const date = new Date(baseDate);
    date.setMonth(date.getMonth() - i);

    let trendFactor = 1;
    if (trend === "emerging") {
      trendFactor = 0.7 + (0.3 * (12 - i)) / 12;
    } else if (trend === "declining") {
      trendFactor = 1.3 - (0.3 * (12 - i)) / 12;
    }

    const monthNoise = 0.92 + hashUnit(`${skillName}:${i}:noise`) * 0.16;
    const value = Math.round(demandScore * trendFactor * monthNoise);
    const postingsBase = Math.round(value * 10);

    months.push({
      month: date.toISOString().slice(0, 7),
      demand: Math.min(100, Math.max(0, value)),
      jobPostings:
        postingsBase +
        Math.round(hashUnit(`${skillName}:${i}:postings`) * 80),
    });
  }

  return months;
}

function catalogEntryForSkill(skillName) {
  const lower = skillName.toLowerCase();
  for (const [category, skills] of Object.entries(SKILL_CATALOG)) {
    const hit = skills.find((s) => s.skill.toLowerCase() === lower);
    if (hit) return { ...hit, category };
  }
  return null;
}

/**
 * Build trend row for a skill name (catalog → DB category → defaults).
 */
export async function resolveSkillTrend(skillName, categoryHint) {
  const catalog = catalogEntryForSkill(skillName);
  if (catalog) {
    const liveData = await enrichWithLiveData(catalog.skill).catch(() => null);
    return {
      skill: catalog.skill,
      category: catalog.category,
      trend: catalog.trend,
      demandScore: catalog.baseDemand,
      growthRate: growthRateForTrend(catalog.trend, catalog.skill),
      historicalData: generateSkillTrendData(
        catalog.skill,
        catalog.trend,
        catalog.baseDemand,
      ),
      source: "catalog",
      liveJobCount: liveData?.liveJobCount ?? 0,
      salaryMin: liveData?.salaryRange?.min ?? 0,
      salaryMedian: liveData?.salaryRange?.median ?? 0,
      salaryMax: liveData?.salaryRange?.max ?? 0,
      dataSource: liveData?.liveJobCount > 0 ? "adzuna" : "catalog",
    };
  }

  try {
    const dbSkill = await prisma.skill.findFirst({
      where: {
        OR: [
          { name: { equals: skillName, mode: "insensitive" } },
          { synonyms: { has: skillName } },
        ],
      },
      include: { category: true },
    });
    if (dbSkill) {
      const u = hashUnit(dbSkill.name);
      const trend =
        u > 0.65 ? "emerging" : u > 0.25 ? "stable" : "declining";
      const demandScore = Math.round(55 + u * 40);
      const liveData = await enrichWithLiveData(dbSkill.name).catch(() => null);
      return {
        skill: dbSkill.name,
        category: dbSkill.category?.name || categoryHint || "Technical Skills",
        trend,
        demandScore,
        growthRate: growthRateForTrend(trend, dbSkill.name),
        historicalData: generateSkillTrendData(dbSkill.name, trend, demandScore),
        source: "database",
        liveJobCount: liveData?.liveJobCount ?? 0,
        salaryMin: liveData?.salaryRange?.min ?? 0,
        salaryMedian: liveData?.salaryRange?.median ?? 0,
        salaryMax: liveData?.salaryRange?.max ?? 0,
        dataSource: liveData?.liveJobCount > 0 ? "adzuna" : "database",
      };
    }
  } catch {
    /* prisma optional */
  }

  const u = hashUnit(skillName);
  const trend = u > 0.6 ? "emerging" : u > 0.3 ? "stable" : "declining";
  const demandScore = Math.round(58 + u * 35);
  const liveData = await enrichWithLiveData(skillName).catch(() => null);
  return {
    skill: skillName,
    category: categoryHint || "General",
    trend,
    demandScore,
    growthRate: growthRateForTrend(trend, skillName),
    historicalData: generateSkillTrendData(skillName, trend, demandScore),
    source: "estimated",
    liveJobCount: liveData?.liveJobCount ?? 0,
    salaryMin: liveData?.salaryRange?.min ?? 0,
    salaryMedian: liveData?.salaryRange?.median ?? 0,
    salaryMax: liveData?.salaryRange?.max ?? 0,
    dataSource: liveData?.liveJobCount > 0 ? "adzuna" : "estimated",
  };
}

/**
 * @param {string} [category]
 * @param {number} [limit]
 */
export async function getTopTrendingSkills(category, limit = 10) {
  const allSkills = [];

  for (const [cat, skills] of Object.entries(SKILL_CATALOG)) {
    if (category && category !== cat) continue;
    for (const skill of skills) {
      const liveData = await enrichWithLiveData(skill.skill).catch(() => null);
      allSkills.push({
        skill: skill.skill,
        category: cat,
        trend: skill.trend,
        demandScore: skill.baseDemand,
        growthRate: growthRateForTrend(skill.trend, skill.skill),
        historicalData: generateSkillTrendData(
          skill.skill,
          skill.trend,
          skill.baseDemand,
        ),
        source: "catalog",
        liveJobCount: liveData?.liveJobCount ?? 0,
        salaryMedian: liveData?.salaryRange?.median ?? 0,
        dataSource: liveData?.liveJobCount > 0 ? "adzuna" : "catalog",
      });
    }
  }

  try {
    const dbSkills = await prisma.skill.findMany({
      include: { category: true },
      take: 200,
    });
    for (const s of dbSkills) {
      if (allSkills.some((x) => x.skill.toLowerCase() === s.name.toLowerCase())) {
        continue;
      }
      const row = await resolveSkillTrend(s.name, s.category?.name);
      if (category && row.category !== category) continue;
      allSkills.push(row);
    }
  } catch {
    /* ignore */
  }

  allSkills.sort((a, b) => b.demandScore - a.demandScore);
  return allSkills.slice(0, limit);
}

/**
 * Transformer-backed trend for a single custom skill (cached catalog first).
 */
export async function getSkillTrendWithTransformer(skillName) {
  const catalog = await resolveSkillTrend(skillName);
  if (catalog.source === "catalog") return catalog;

  try {
    const predictions = await predictMarketTrends([skillName]);
    const pred = predictions[0];
    if (pred) {
      const trend =
        pred.trend === "emerging technology" || pred.trend === "high demand skill"
          ? "emerging"
          : pred.trend === "declining technology"
            ? "declining"
            : "stable";
      const demandScore = Math.round(
        Math.min(100, Math.max(40, (pred.confidence || 0.5) * 100)),
      );
      return {
        ...catalog,
        trend,
        demandScore,
        growthRate: growthRateForTrend(trend, skillName),
        historicalData: generateSkillTrendData(skillName, trend, demandScore),
        source: "transformer",
      };
    }
  } catch {
    /* model unavailable */
  }

  return catalog;
}

/**
 * Enrich skill trend data with live job posting counts from Adzuna.
 * Results are cached for 6 hours.
 */
export async function enrichWithLiveData(skillName) {
  const cacheKey = `live:${skillName.toLowerCase()}`;
  const cached = await getCache(cacheKey);
  if (cached) return cached;

  const liveJobs = await searchJobs(skillName, "", 1);
  const salaryRange = extractSalaryRange(liveJobs);
  const jobCount = liveJobs.length;

  const result = {
    skill: skillName,
    liveJobCount: jobCount,
    salaryRange,
    dataSource: jobCount > 0 ? "adzuna" : "estimated",
    fetchedAt: new Date().toISOString(),
  };

  if (jobCount > 0) {
    await setCache(cacheKey, result, 21600);
  }

  return result;
}

/**
 * Get live job posting count for a skill from Adzuna.
 */
export async function getLiveJobCount(skillName) {
  const enriched = await enrichWithLiveData(skillName);
  return enriched.liveJobCount;
}
