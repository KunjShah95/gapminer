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
 */
export async function normalizationAgentNode(
  state: typeof GraphAnnotation.State,
) {
  const extractedSkills = state.resumeData.skills || [];

  const dbSkills = await prisma.skill.findMany({
    select: { id: true, name: true, synonyms: true, categoryId: true },
  });
  const knownSkillNames = dbSkills.map((s: { name: string }) => s.name);

  const normalized: NormalizedSkill[] = [];

  async function getFullHierarchy(skillId: string): Promise<string[]> {
    const hierarchy: string[] = [];
    let currentId: string | null = skillId;

    while (currentId) {
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

    return hierarchy;
  }

  for (const skillObj of extractedSkills) {
    const skillName = skillObj.name;

    const dbSkill = await prisma.skill.findFirst({
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

    if (!dbSkill) {
      transformerResult = await normalizeSkillName(skillName, knownSkillNames);
      if (transformerResult.canonical !== skillName) {
        const matchedDbSkill = await prisma.skill.findFirst({
          where: {
            name: { equals: transformerResult.canonical, mode: "insensitive" },
          },
          include: { category: true, parentSkill: true },
        });
        if (matchedDbSkill) {
          finalSkill = matchedDbSkill;
        }
      }
    }

    if (finalSkill) {
      const hierarchy = await getFullHierarchy(finalSkill.id);

      const proficiencyResult = await estimateSkillProficiency(
        skillName,
        state.resumeText.substring(0, 1000),
      );

      normalized.push({
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
        normalized.push({
          originalName: `parent:${parentName}`,
          canonicalName: parentName,
          proficiency: proficiencyResult.proficiency || "Intermediate",
          isFoundInDb: true,
          category: finalSkill.category?.name || undefined,
          hierarchy,
          transformerConfidence: proficiencyResult.confidence * 0.8,
        });
      }
    } else {
      normalized.push({
        originalName: skillName,
        canonicalName: skillName,
        proficiency: skillObj.proficiency || "Intermediate",
        isFoundInDb: false,
        category: undefined,
        hierarchy: [skillName],
        transformerConfidence: transformerResult?.confidence || 0.5,
      });
    }
  }

  const seen = new Set<string>();
  const finalNormalized = normalized.filter((el) => {
    const duplicate = seen.has(el.canonicalName);
    seen.add(el.canonicalName);
    return !duplicate;
  });

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
