/**
 * Canonical skill taxonomy for seeding — kept separate from seed.ts for maintainability.
 */

export type CatalogSkill = {
  name: string;
  category: 'Programming Languages' | 'Web Frameworks' | 'Cloud & DevOps' | 'AI/ML' | 'Data' | 'Technical Skills';
  synonyms?: string[];
  parentSkillName?: string;
  baseDemand?: number;
  trend?: 'emerging' | 'stable' | 'declining';
};

export const EXPANDED_SKILL_CATALOG: CatalogSkill[] = [
  { name: 'JavaScript', category: 'Programming Languages', synonyms: ['JS', 'ES6', 'ECMAScript'], baseDemand: 92, trend: 'stable' },
  { name: 'TypeScript', category: 'Programming Languages', synonyms: ['TS'], baseDemand: 88, trend: 'emerging' },
  { name: 'Python', category: 'Programming Languages', synonyms: ['Py', 'Python3'], baseDemand: 95, trend: 'stable' },
  { name: 'Java', category: 'Programming Languages', synonyms: ['JDK'], baseDemand: 85, trend: 'stable' },
  { name: 'Go', category: 'Programming Languages', synonyms: ['Golang'], baseDemand: 78, trend: 'emerging' },
  { name: 'Rust', category: 'Programming Languages', synonyms: ['Rustlang'], baseDemand: 72, trend: 'emerging' },
  { name: 'C++', category: 'Programming Languages', baseDemand: 75, trend: 'stable' },
  { name: 'Kotlin', category: 'Programming Languages', baseDemand: 70, trend: 'emerging' },
  { name: 'Ruby', category: 'Programming Languages', baseDemand: 62, trend: 'declining' },
  { name: 'Swift', category: 'Programming Languages', baseDemand: 74, trend: 'stable' },
  { name: 'React', category: 'Web Frameworks', synonyms: ['React.js', 'ReactJS'], baseDemand: 94, trend: 'stable' },
  { name: 'Next.js', category: 'Web Frameworks', synonyms: ['NextJS'], baseDemand: 85, trend: 'emerging' },
  { name: 'Vue.js', category: 'Web Frameworks', synonyms: ['Vue'], baseDemand: 76, trend: 'stable' },
  { name: 'Angular', category: 'Web Frameworks', baseDemand: 72, trend: 'declining' },
  { name: 'Node.js', category: 'Web Frameworks', synonyms: ['Node'], baseDemand: 90, trend: 'stable' },
  { name: 'Express', category: 'Web Frameworks', baseDemand: 80, trend: 'stable' },
  { name: 'Django', category: 'Web Frameworks', baseDemand: 78, trend: 'stable' },
  { name: 'FastAPI', category: 'Web Frameworks', baseDemand: 82, trend: 'emerging' },
  { name: 'Svelte', category: 'Web Frameworks', baseDemand: 65, trend: 'emerging' },
  { name: 'AWS', category: 'Cloud & DevOps', synonyms: ['Amazon Web Services'], baseDemand: 93, trend: 'stable' },
  { name: 'Azure', category: 'Cloud & DevOps', baseDemand: 85, trend: 'stable' },
  { name: 'GCP', category: 'Cloud & DevOps', synonyms: ['Google Cloud'], baseDemand: 78, trend: 'stable' },
  { name: 'Kubernetes', category: 'Cloud & DevOps', synonyms: ['K8s'], baseDemand: 88, trend: 'emerging' },
  { name: 'Docker', category: 'Cloud & DevOps', baseDemand: 90, trend: 'stable' },
  { name: 'Terraform', category: 'Cloud & DevOps', synonyms: ['IaC'], baseDemand: 80, trend: 'emerging' },
  { name: 'Infrastructure as Code', category: 'Cloud & DevOps', synonyms: ['IaC', 'Pulumi'], baseDemand: 87, trend: 'emerging' },
  { name: 'CI/CD', category: 'Cloud & DevOps', baseDemand: 86, trend: 'stable' },
  { name: 'Observability', category: 'Cloud & DevOps', synonyms: ['Monitoring', 'Prometheus', 'Grafana'], baseDemand: 84, trend: 'emerging' },
  { name: 'Machine Learning', category: 'AI/ML', synonyms: ['ML'], baseDemand: 86, trend: 'emerging' },
  { name: 'Deep Learning', category: 'AI/ML', synonyms: ['DL'], parentSkillName: 'Machine Learning', baseDemand: 80, trend: 'emerging' },
  { name: 'TensorFlow', category: 'AI/ML', synonyms: ['TF'], parentSkillName: 'Deep Learning', baseDemand: 82, trend: 'emerging' },
  { name: 'PyTorch', category: 'AI/ML', parentSkillName: 'Deep Learning', baseDemand: 85, trend: 'emerging' },
  { name: 'LLMs', category: 'AI/ML', synonyms: ['Large Language Models', 'GPT'], baseDemand: 91, trend: 'emerging' },
  { name: 'LangChain', category: 'AI/ML', baseDemand: 75, trend: 'emerging' },
  { name: 'MLOps', category: 'AI/ML', baseDemand: 79, trend: 'emerging' },
  { name: 'Prompt Engineering', category: 'AI/ML', baseDemand: 88, trend: 'emerging' },
  { name: 'PostgreSQL', category: 'Data', synonyms: ['Postgres'], baseDemand: 88, trend: 'stable' },
  { name: 'MongoDB', category: 'Data', baseDemand: 80, trend: 'stable' },
  { name: 'Redis', category: 'Data', baseDemand: 82, trend: 'stable' },
  { name: 'SQL', category: 'Data', baseDemand: 90, trend: 'stable' },
  { name: 'Snowflake', category: 'Data', baseDemand: 76, trend: 'emerging' },
  { name: 'Apache Spark', category: 'Data', synonyms: ['Spark'], baseDemand: 78, trend: 'stable' },
  { name: 'BullMQ', category: 'Technical Skills', synonyms: ['Bull'], baseDemand: 70, trend: 'emerging' },
  { name: 'GraphQL', category: 'Technical Skills', baseDemand: 72, trend: 'stable' },
  { name: 'REST APIs', category: 'Technical Skills', synonyms: ['REST'], baseDemand: 85, trend: 'stable' },
  { name: 'System Design', category: 'Technical Skills', baseDemand: 88, trend: 'stable' },
  { name: 'Distributed Systems', category: 'Technical Skills', baseDemand: 86, trend: 'emerging' },
];

export const SALARY_BENCHMARK_SEED = [
  { roleTitle: 'Software Engineer', location: 'San Francisco, US', companyTier: 'faang', yearsExperience: 3, minSalary: 140000, medianSalary: 175000, maxSalary: 220000, totalCompMedian: 280000 },
  { roleTitle: 'Software Engineer', location: 'New York, US', companyTier: 'mid', yearsExperience: 3, minSalary: 120000, medianSalary: 150000, maxSalary: 185000, totalCompMedian: 170000 },
  { roleTitle: 'Software Engineer', location: 'Remote, US', companyTier: 'mid', yearsExperience: 3, minSalary: 100000, medianSalary: 130000, maxSalary: 160000, totalCompMedian: 145000 },
  { roleTitle: 'Senior Software Engineer', location: 'San Francisco, US', companyTier: 'faang', yearsExperience: 7, minSalary: 180000, medianSalary: 230000, maxSalary: 300000, totalCompMedian: 380000 },
  { roleTitle: 'Senior Platform Engineer', location: 'Remote, US', companyTier: 'mid', yearsExperience: 6, minSalary: 150000, medianSalary: 185000, maxSalary: 225000, totalCompMedian: 210000 },
  { roleTitle: 'Frontend Engineer', location: 'Austin, US', companyTier: 'startup', yearsExperience: 4, minSalary: 110000, medianSalary: 135000, maxSalary: 165000, totalCompMedian: 150000 },
  { roleTitle: 'Machine Learning Engineer', location: 'Seattle, US', companyTier: 'faang', yearsExperience: 5, minSalary: 160000, medianSalary: 210000, maxSalary: 270000, totalCompMedian: 320000 },
  { roleTitle: 'DevOps Engineer', location: 'London, UK', companyTier: 'mid', yearsExperience: 5, minSalary: 65000, medianSalary: 85000, maxSalary: 105000, totalCompMedian: 95000 },
];
