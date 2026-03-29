import { prisma } from "../../core/database.js";
import { GraphAnnotation } from "../state.js";

/**
 * AGENT 2: NormalizationAgent
 * Maps extracted skills to canonical terms in the database taxonomy.
 * Traverses the full parent skill hierarchy.
 */
export async function normalizationAgentNode(state: typeof GraphAnnotation.State) {
  const extractedSkills = state.resumeData.skills || [];
  
  const normalized: Array<{ 
    originalName: string; 
    canonicalName: string; 
    proficiency: string;
    isFoundInDb: boolean;
    category?: string;
    hierarchy: string[];
  }> = [];

  async function getFullHierarchy(skillId: string): Promise<string[]> {
    const hierarchy: string[] = [];
    let currentId: string | null = skillId;
    
    while (currentId) {
      const skill: { id: string, name: string, parentSkillId: string | null } | null = await prisma.skill.findUnique({
        where: { id: currentId },
        select: { id: true, name: true, parentSkillId: true }
      });
      
      if (skill) {
        hierarchy.unshift(skill.name);
        currentId = skill.parentSkillId;
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
          { name: { equals: skillName, mode: 'insensitive' } },
          { synonyms: { has: skillName } }
        ]
      },
      include: {
        category: true,
        parentSkill: true
      }
    });
    
    if (dbSkill) {
      const hierarchy = await getFullHierarchy(dbSkill.id);
      
      normalized.push({
        originalName: skillName,
        canonicalName: dbSkill.name,
        proficiency: skillObj.proficiency || "Intermediate",
        isFoundInDb: true,
        category: dbSkill.category?.name || undefined,
        hierarchy
      });
      
      for (const parentName of hierarchy.slice(0, -1)) {
        normalized.push({
          originalName: `parent:${parentName}`,
          canonicalName: parentName,
          proficiency: skillObj.proficiency || "Intermediate",
          isFoundInDb: true,
          category: dbSkill.category?.name || undefined,
          hierarchy
        });
      }
    } else {
      normalized.push({
        originalName: skillName,
        canonicalName: skillName,
        proficiency: skillObj.proficiency || "Intermediate",
        isFoundInDb: false,
        category: undefined,
        hierarchy: [skillName]
      });
    }
  }

  const seen = new Set();
  const finalNormalized = normalized.filter(el => {
    const duplicate = seen.has(el.canonicalName);
    seen.add(el.canonicalName);
    return !duplicate;
  });

  const skillsByCategory = finalNormalized.reduce((acc, skill) => {
    const cat = skill.category || 'Other';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(skill);
    return acc;
  }, {} as Record<string, typeof finalNormalized>);

  return { 
    normalizedSkills: finalNormalized.map(s => s.canonicalName),
    normalizedSkillsDetail: finalNormalized,
    skillsByCategory
  };
}
