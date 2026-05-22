import { prisma } from "../../core/database.js";
import { GraphAnnotation } from "../state.js";
import {
  normalizeSkillName,
  estimateSkillProficiency,
} from "../../services/transformerModels.js";

interface NormalizedSkill {
  originalName: string;
  canonicalName: string;
  proficiency: string;
  isFoundInDb: boolean;
  category?: string;
  hierarchy: string[];
  transformerConfidence: number;
}

/**
 * AGENT 2: NormalizationAgent
 * Maps extracted skills to canonical terms using transformer embeddings + database lookup.
 *
 * Performance: Uses concurrent batch processing and hierarchy caching
 * to avoid the O(N * M) sequential DB + model bottleneck.
 */
export async function normalizationAgentNode(
  state: typeof GraphAnnotation.State,
) {
  const extractedSkills = state.resumeData.skills || [];
  if (extractedSkills.length === 0) {
    return {
      normalizedSkills: [],
      normalizedSkillsDetail: [],
      skillsByCategory: {},
    };
  }

  // ── Single bulk fetch of all known skills ──
  const dbSkills = await prisma.skill.findMany({
    select: { id: true, name: true, synonyms: true, categoryId: true },
  });
  const knownSkillNames = dbSkills.map((s: { name: string }) => s.name);

  // ── Hierarchy cache: avoids repeated recursive parent lookups ──
  const hierarchyCache = new Map<string, string[]>();

  async function getFullHierarchy(skillId: string): Promise<string[]> {
    if (hierarchyCache.has(skillId)) {
      return hierarchyCache.get(skillId)!;
    }

    const hierarchy: string[] = [];
    let currentId: string | null = skillId;

    while (currentId) {
      // Check if we already resolved this ancestor subtree
      if (hierarchyCache.has(currentId)) {
        hierarchy.unshift(...hierarchyCache.get(currentId)!);
        break;
      }

      const result: {
        id: string;
        name: string;
        parentSkillId: string | null;
      } | null = await prisma.skill.findUnique({
        where: { id: currentId },
        select: { id: true, name: true, parentSkillId: true },
      });

      if (result) {
        hierarchy.unshift(result.name);
        currentId = result.parentSkillId;
      } else {
        break;
      }
    }

    hierarchyCache.set(skillId, hierarchy);
    return hierarchy;
  }

  // ── Parallel skill resolution ──
  // Process all skills concurrently instead of sequentially.
  const BATCH_SIZE = 5; // Limit concurrency to avoid overwhelming the DB pool
  const normalized: NormalizedSkill[] = [];
  const resumeSnippet = state.resumeText.substring(0, 1000);

  for (let i = 0; i < extractedSkills.length; i += BATCH_SIZE) {
    const batch = extractedSkills.slice(i, i + BATCH_SIZE);

    const batchResults = await Promise.all(
      batch.map(async (skillObj: { name: string; proficiency?: string }) => {
        const skillName = skillObj.name;
        const results: NormalizedSkill[] = [];

        // Step 1: Direct DB lookup (name match or synonym match)
        let dbSkill = await prisma.skill.findFirst({
          where: {
            OR: [
              { name: { equals: skillName, mode: "insensitive" } },
              { synonyms: { has: skillName } },
            ],
          },
          include: {
            category: true,
            parentSkill: true,
          },
        });

        let finalSkill = dbSkill;
        let transformerResult: { canonical: string; confidence: number } | null =
          null;

        // Step 2: If no DB match, use transformer to normalize the name
        if (!dbSkill) {
          transformerResult = await normalizeSkillName(
            skillName,
            knownSkillNames,
          );
          if (transformerResult.canonical !== skillName) {
            const matchedDbSkill = await prisma.skill.findFirst({
              where: {
                name: {
                  equals: transformerResult.canonical,
                  mode: "insensitive",
                },
              },
              include: { category: true, parentSkill: true },
            });
            if (matchedDbSkill) {
              finalSkill = matchedDbSkill;
            }
          }
        }

        if (finalSkill) {
          // Step 3: Hierarchy + proficiency run concurrently
          const [hierarchy, proficiencyResult] = await Promise.all([
            getFullHierarchy(finalSkill.id),
            estimateSkillProficiency(skillName, resumeSnippet),
          ]);

          results.push({
            originalName: skillName,
            canonicalName: finalSkill.name,
            proficiency:
              proficiencyResult.proficiency ||
              skillObj.proficiency ||
              "Intermediate",
            isFoundInDb: true,
            category: finalSkill.category?.name || undefined,
            hierarchy,
            transformerConfidence: proficiencyResult.confidence,
          });

          for (const parentName of hierarchy.slice(0, -1)) {
            results.push({
              originalName: `parent:${parentName}`,
              canonicalName: parentName,
              proficiency:
                proficiencyResult.proficiency || "Intermediate",
              isFoundInDb: true,
              category: finalSkill.category?.name || undefined,
              hierarchy,
              transformerConfidence: proficiencyResult.confidence * 0.8,
            });
          }
        } else {
          results.push({
            originalName: skillName,
            canonicalName: skillName,
            proficiency: skillObj.proficiency || "Intermediate",
            isFoundInDb: false,
            category: undefined,
            hierarchy: [skillName],
            transformerConfidence: transformerResult?.confidence || 0.5,
          });
        }

        return results;
      }),
    );

    // Flatten batch results into the main array
    for (const batch of batchResults) {
      normalized.push(...batch);
    }
  }

  // ── Deduplicate by canonical name ──
  const seen = new Set<string>();
  const finalNormalized = normalized.filter((el) => {
    const duplicate = seen.has(el.canonicalName);
    seen.add(el.canonicalName);
    return !duplicate;
  });

  // ── Group by category ──
  const skillsByCategory: Record<string, NormalizedSkill[]> = {};
  for (const skill of finalNormalized) {
    const cat = skill.category || "Other";
    if (!skillsByCategory[cat]) skillsByCategory[cat] = [];
    skillsByCategory[cat].push(skill);
  }

  return {
    normalizedSkills: finalNormalized.map((s) => s.canonicalName),
    normalizedSkillsDetail: finalNormalized,
    skillsByCategory,
  };
}
