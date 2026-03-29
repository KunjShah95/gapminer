import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const techCategory = await prisma.skillCategory.upsert({
    where: { name: 'Technical Skills' },
    update: {},
    create: { name: 'Technical Skills' },
  });

  const languageCategory = await prisma.skillCategory.upsert({
    where: { name: 'Programming Languages' },
    update: {},
    create: { name: 'Programming Languages' },
  });

  const skills = [
    { name: 'JavaScript', categoryId: languageCategory.id, synonyms: ['JS', 'ES6', 'ECMAScript'] },
    { name: 'TypeScript', categoryId: languageCategory.id, synonyms: ['TS', 'Typed JS'] },
    { name: 'Python', categoryId: languageCategory.id, synonyms: ['Py', 'Python3'] },
    { name: 'React', categoryId: techCategory.id, synonyms: ['React.js', 'ReactJS', 'CRA', 'Next.js'] },
    { name: 'Kubernetes', categoryId: techCategory.id, synonyms: ['K8s', 'Kube'] },
    { name: 'Machine Learning', categoryId: techCategory.id, synonyms: ['ML', 'Statistical Learning'] },
    { name: 'Deep Learning', categoryId: techCategory.id, synonyms: ['DL', 'Neural Networks'], parentSkillName: 'Machine Learning' },
    { name: 'TensorFlow', categoryId: techCategory.id, synonyms: ['TF'], parentSkillName: 'Deep Learning' },
    { name: 'PyTorch', categoryId: techCategory.id, synonyms: ['Torch'], parentSkillName: 'Deep Learning' },
  ];

  for (const skillData of skills) {
    const { parentSkillName, ...rest } = skillData;
    let parentId: string | undefined;

    if (parentSkillName) {
      const parent = await prisma.skill.findUnique({ where: { name: parentSkillName } });
      parentId = parent?.id;
    }

    await prisma.skill.upsert({
      where: { name: rest.name },
      update: { ...rest, parentSkillId: parentId },
      create: { ...rest, parentSkillId: parentId },
    });
  }

  console.log('✅ Seeded Skill Taxonomy');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
