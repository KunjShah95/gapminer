import { PrismaClient } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';
import { query, initDb } from '../src/core/database.js';
import { hashPassword } from '../src/core/security.js';
import { EXPANDED_SKILL_CATALOG, SALARY_BENCHMARK_SEED } from './skill-catalog.js';

const prisma = new PrismaClient();

const SAMPLE_PASSWORD = 'Password123!';

type SeedUser = {
  email: string;
  name: string;
  plan: string;
  analysesUsed: number;
  analysesLimit: number;
  isVerified: boolean;
};

type SeedProfile = {
  userEmail: string;
  resume: {
    filename: string;
    fileType: string;
    parsedData: Record<string, unknown>;
  };
  job: {
    title: string;
    company: string;
    sourceUrl: string;
    rawText: string;
    parsedData: Record<string, unknown>;
  };
  analysis: {
    seniority: string;
    overallScore: number;
    resumeStrengthScore: number;
    atsScore: number;
    peerPercentile: number;
    status: string;
    gapAnalysis: {
      missingSkills: string[];
      matchedSkills: string[];
      criticalGaps: string[];
    };
    roadmap: {
      title: string;
      totalWeeks: number;
      totalHours: number;
      milestones: Array<{
        week: number;
        title: string;
        description: string;
        skills: string[];
        estimatedHours: number;
        resources: Array<{
          title: string;
          url: string;
          type: string;
          provider: string;
          estimatedHours: number;
          isFree: boolean;
          rating: number;
        }>;
      }>;
    };
    skillGaps: Array<{
      skill: string;
      category: string;
      status: string;
      severity: string;
      confidence: number;
      resumeVersion: string;
      requiredVersion: string;
      radarScore: number;
      marketDemand: number;
      trendDelta: number;
    }>;
  };
};

async function main() {
  await initDb();

  await query(`
    ALTER TABLE analyses ADD COLUMN IF NOT EXISTS job_description_id TEXT REFERENCES job_descriptions(id);
    ALTER TABLE analyses ADD COLUMN IF NOT EXISTS roadmap_id TEXT REFERENCES roadmaps(id);
    ALTER TABLE analyses ADD COLUMN IF NOT EXISTS feedback_rating INTEGER;
  `);

  const categoryIds: Record<string, string> = {};
  const categoryNames = [
    'Technical Skills',
    'Programming Languages',
    'Web Frameworks',
    'Cloud & DevOps',
    'AI/ML',
    'Data',
  ] as const;

  for (const name of categoryNames) {
    const cat = await prisma.skillCategory.upsert({
      where: { name },
      update: {},
      create: { name },
    });
    categoryIds[name] = cat.id;
  }

  for (const entry of EXPANDED_SKILL_CATALOG) {
    const categoryId =
      categoryIds[entry.category] ?? categoryIds['Technical Skills'];
    let parentId: string | undefined;

    if (entry.parentSkillName) {
      const parent = await prisma.skill.findUnique({
        where: { name: entry.parentSkillName },
      });
      parentId = parent?.id;
    }

    await prisma.skill.upsert({
      where: { name: entry.name },
      update: {
        synonyms: entry.synonyms ?? [],
        categoryId,
        parentSkillId: parentId,
      },
      create: {
        name: entry.name,
        synonyms: entry.synonyms ?? [],
        categoryId,
        parentSkillId: parentId,
      },
    });
  }

  for (const bench of SALARY_BENCHMARK_SEED) {
    await prisma.salaryBenchmark.upsert({
      where: {
        roleTitle_location_companyTier_yearsExperience: {
          roleTitle: bench.roleTitle,
          location: bench.location,
          companyTier: bench.companyTier,
          yearsExperience: bench.yearsExperience,
        },
      },
      update: {
        minSalary: bench.minSalary,
        medianSalary: bench.medianSalary,
        maxSalary: bench.maxSalary,
        totalCompMedian: bench.totalCompMedian,
        totalCompMin: bench.minSalary,
        totalCompMax: bench.maxSalary,
        sampleSize: 120,
        dataSource: 'seed',
      },
      create: {
        roleTitle: bench.roleTitle,
        location: bench.location,
        companyTier: bench.companyTier,
        yearsExperience: bench.yearsExperience,
        minSalary: bench.minSalary,
        medianSalary: bench.medianSalary,
        maxSalary: bench.maxSalary,
        totalCompMin: bench.minSalary,
        totalCompMedian: bench.totalCompMedian,
        totalCompMax: bench.maxSalary,
        sampleSize: 120,
        dataSource: 'seed',
      },
    });
  }

  console.log(`✅ Seeded ${EXPANDED_SKILL_CATALOG.length} skills and ${SALARY_BENCHMARK_SEED.length} salary benchmarks`);

  await query(
    `UPDATE users SET role = 'RECRUITER' WHERE email = 'recruiter@gapminer.dev'`,
  );
  await prisma.user.updateMany({
    where: { email: 'recruiter@gapminer.dev' },
    data: { role: 'RECRUITER' },
  }).catch(() => undefined);

  const seededUsers: SeedUser[] = [
    {
      email: 'demo@gapminer.dev',
      name: 'Demo User',
      plan: 'free',
      analysesUsed: 1,
      analysesLimit: 5,
      isVerified: true,
    },
    {
      email: 'pro@gapminer.dev',
      name: 'Pro Tester',
      plan: 'pro',
      analysesUsed: 3,
      analysesLimit: 25,
      isVerified: true,
    },
    {
      email: 'recruiter@gapminer.dev',
      name: 'Recruiter Demo',
      plan: 'teams',
      analysesUsed: 0,
      analysesLimit: 50,
      isVerified: true,
    },
  ];

  const profiles: SeedProfile[] = [
    {
      userEmail: 'demo@gapminer.dev',
      resume: {
        filename: 'alex-chen-resume.pdf',
        fileType: 'application/pdf',
        parsedData: {
          name: 'Alex Chen',
          summary: 'Platform engineer with 6 years of experience building resilient backend systems, Kubernetes workloads, and observability pipelines.',
          workExperience: [
            {
              company: 'Northstar Health',
              title: 'Platform Engineer',
              duration: '2021-Present',
              highlights: [
                'Reduced deployment failures by 42% by standardizing Kubernetes rollouts and health checks',
                'Built internal developer tooling in TypeScript and Go for service ownership and observability',
                'Migrated 12 services to event-driven patterns with Redis and BullMQ',
              ],
            },
          ],
          skills: ['TypeScript', 'Node.js', 'Kubernetes', 'Redis', 'Observability', 'PostgreSQL'],
        },
      },
      job: {
        title: 'Senior Platform Engineer',
        company: 'FinFlow',
        sourceUrl: 'https://careers.finflow.dev/senior-platform-engineer',
        rawText:
          'Senior Platform Engineer needed to own Kubernetes-based delivery, service observability, infrastructure automation, and internal developer platforms across a multi-team environment.',
        parsedData: {
          title: 'Senior Platform Engineer',
          company: 'FinFlow',
          seniority: 'Senior',
          mustHaveSkills: ['Kubernetes', 'Infrastructure as Code', 'Observability', 'TypeScript', 'PostgreSQL'],
          niceToHaveSkills: ['Pulumi', 'Prometheus', 'Distributed Systems'],
        },
      },
      analysis: {
        seniority: 'senior',
        overallScore: 78,
        resumeStrengthScore: 82,
        atsScore: 74,
        peerPercentile: 71,
        status: 'complete',
        gapAnalysis: {
          missingSkills: ['Infrastructure as Code', 'Pulumi', 'Prometheus'],
          matchedSkills: ['Kubernetes', 'TypeScript', 'PostgreSQL', 'Observability'],
          criticalGaps: ['Infrastructure as Code'],
        },
        roadmap: {
          title: 'Senior Platform Engineer Ramp-Up',
          totalWeeks: 6,
          totalHours: 24,
          milestones: [
            {
              week: 1,
              title: 'Close the IaC gap',
              description: 'Write one production-ready infrastructure module and document rollout conventions.',
              skills: ['Terraform', 'Pulumi', 'IaC'],
              estimatedHours: 6,
              resources: [
                {
                  title: 'Pulumi Kubernetes overview',
                  url: 'https://www.pulumi.com/docs/intro/cloud-providers/kubernetes/',
                  type: 'article',
                  provider: 'Pulumi',
                  estimatedHours: 2,
                  isFree: true,
                  rating: 4.8,
                },
              ],
            },
            {
              week: 2,
              title: 'Observability hardening',
              description: 'Add Prometheus metrics and alert rules for the most critical service path.',
              skills: ['Prometheus', 'Metrics', 'Alerting'],
              estimatedHours: 4,
              resources: [
                {
                  title: 'Prometheus getting started',
                  url: 'https://prometheus.io/docs/introduction/overview/',
                  type: 'article',
                  provider: 'Prometheus',
                  estimatedHours: 1.5,
                  isFree: true,
                  rating: 4.7,
                },
              ],
            },
          ],
        },
        skillGaps: [
          {
            skill: 'Infrastructure as Code',
            category: 'Platform',
            status: 'missing',
            severity: 'critical',
            confidence: 0.95,
            resumeVersion: 'basic',
            requiredVersion: 'advanced',
            radarScore: 42,
            marketDemand: 91,
            trendDelta: 8,
          },
          {
            skill: 'Kubernetes',
            category: 'Platform',
            status: 'matched',
            severity: 'medium',
            confidence: 0.92,
            resumeVersion: 'advanced',
            requiredVersion: 'advanced',
            radarScore: 89,
            marketDemand: 88,
            trendDelta: 4,
          },
          {
            skill: 'Observability',
            category: 'Reliability',
            status: 'matched',
            severity: 'medium',
            confidence: 0.89,
            resumeVersion: 'intermediate',
            requiredVersion: 'advanced',
            radarScore: 76,
            marketDemand: 84,
            trendDelta: 6,
          },
          {
            skill: 'Pulumi',
            category: 'Platform',
            status: 'missing',
            severity: 'high',
            confidence: 0.8,
            resumeVersion: 'none',
            requiredVersion: 'intermediate',
            radarScore: 31,
            marketDemand: 72,
            trendDelta: 11,
          },
        ],
      },
    },
    {
      userEmail: 'pro@gapminer.dev',
      resume: {
        filename: 'maya-patel-resume.pdf',
        fileType: 'application/pdf',
        parsedData: {
          name: 'Maya Patel',
          summary: 'Frontend engineer specializing in React, design systems, and performance-focused product experiences.',
          workExperience: [
            {
              company: 'Orbit Commerce',
              title: 'Senior Frontend Engineer',
              duration: '2020-Present',
              highlights: [
                'Improved conversion by 14% after redesigning checkout flows and reducing interaction latency',
                'Built a shared component system used by 8 product squads',
                'Partnered with product and design to ship accessible interfaces for enterprise customers',
              ],
            },
          ],
          skills: ['React', 'TypeScript', 'Design Systems', 'Performance Optimization', 'Accessibility'],
        },
      },
      job: {
        title: 'Staff Frontend Engineer',
        company: 'Brightlane',
        sourceUrl: 'https://jobs.brightlane.com/staff-frontend-engineer',
        rawText:
          'Staff Frontend Engineer to lead React architecture, design systems, performance budgets, and experimentation frameworks for a consumer SaaS product.',
        parsedData: {
          title: 'Staff Frontend Engineer',
          company: 'Brightlane',
          seniority: 'Staff',
          mustHaveSkills: ['React', 'TypeScript', 'Performance Optimization', 'Accessibility'],
          niceToHaveSkills: ['Experimentation', 'Storybook', 'Web Vitals'],
        },
      },
      analysis: {
        seniority: 'staff',
        overallScore: 84,
        resumeStrengthScore: 88,
        atsScore: 81,
        peerPercentile: 86,
        status: 'complete',
        gapAnalysis: {
          missingSkills: ['Experimentation', 'Web Vitals'],
          matchedSkills: ['React', 'TypeScript', 'Accessibility', 'Design Systems'],
          criticalGaps: [],
        },
        roadmap: {
          title: 'Staff Frontend Engineer Ramp-Up',
          totalWeeks: 4,
          totalHours: 18,
          milestones: [
            {
              week: 1,
              title: 'Performance baseline',
              description: 'Measure Core Web Vitals and identify the top conversion bottleneck.',
              skills: ['Web Vitals', 'Performance'],
              estimatedHours: 5,
              resources: [
                {
                  title: 'web.dev Web Vitals',
                  url: 'https://web.dev/vitals/',
                  type: 'article',
                  provider: 'Google',
                  estimatedHours: 1.5,
                  isFree: true,
                  rating: 4.9,
                },
              ],
            },
          ],
        },
        skillGaps: [
          {
            skill: 'React',
            category: 'Frontend',
            status: 'matched',
            severity: 'medium',
            confidence: 0.97,
            resumeVersion: 'advanced',
            requiredVersion: 'advanced',
            radarScore: 91,
            marketDemand: 96,
            trendDelta: 2,
          },
          {
            skill: 'Experimentation',
            category: 'Product',
            status: 'missing',
            severity: 'high',
            confidence: 0.74,
            resumeVersion: 'none',
            requiredVersion: 'intermediate',
            radarScore: 28,
            marketDemand: 68,
            trendDelta: 7,
          },
          {
            skill: 'Web Vitals',
            category: 'Performance',
            status: 'missing',
            severity: 'medium',
            confidence: 0.83,
            resumeVersion: 'basic',
            requiredVersion: 'advanced',
            radarScore: 61,
            marketDemand: 86,
            trendDelta: 5,
          },
        ],
      },
    },
  ];

  for (const user of seededUsers) {
    const hashedPassword = hashPassword(SAMPLE_PASSWORD);
    await query(
      `INSERT INTO users (
        id, email, name, hashed_password, plan, is_active, is_verified,
        analyses_used, analyses_limit, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, TRUE, $6, $7, $8, NOW(), NOW())
      ON CONFLICT (email) DO UPDATE SET
        name = EXCLUDED.name,
        hashed_password = EXCLUDED.hashed_password,
        plan = EXCLUDED.plan,
        is_active = TRUE,
        is_verified = EXCLUDED.is_verified,
        analyses_used = EXCLUDED.analyses_used,
        analyses_limit = EXCLUDED.analyses_limit,
        updated_at = NOW()`,
      [
        uuidv4(),
        user.email,
        user.name,
        hashedPassword,
        user.plan,
        user.isVerified,
        user.analysesUsed,
        user.analysesLimit,
      ],
    );
  }

  for (const profile of profiles) {
    const { rows: [userRow] } = await query('SELECT id FROM users WHERE email = $1', [profile.userEmail]);
    if (!userRow?.id) {
      continue;
    }

    await query(
      `DELETE FROM feedback WHERE user_id = $1`,
      [userRow.id],
    );
    await query(
      `DELETE FROM learning_resources
       WHERE milestone_id IN (
         SELECT rm.id
         FROM roadmap_milestones rm
         JOIN roadmaps r ON r.id = rm.roadmap_id
         WHERE r.user_id = $1
       )`,
      [userRow.id],
    );
    await query(
      `DELETE FROM roadmap_milestones
       WHERE roadmap_id IN (SELECT id FROM roadmaps WHERE user_id = $1)`,
      [userRow.id],
    );
    await query(
      `DELETE FROM skill_gaps
       WHERE analysis_id IN (SELECT id FROM analyses WHERE user_id = $1)`,
      [userRow.id],
    );
    await query(
      `DELETE FROM analysis_steps
       WHERE analysis_id IN (SELECT id FROM analyses WHERE user_id = $1)`,
      [userRow.id],
    );
    await query(
      `DELETE FROM analyses WHERE user_id = $1`,
      [userRow.id],
    );
    await query(
      `DELETE FROM roadmaps WHERE user_id = $1`,
      [userRow.id],
    );
    await query(
      `DELETE FROM job_descriptions WHERE user_id = $1`,
      [userRow.id],
    );
    await query(
      `DELETE FROM resumes WHERE user_id = $1`,
      [userRow.id],
    );

    const resumeId = uuidv4();
    await query(
      `INSERT INTO resumes (id, user_id, filename, file_url, file_type, parsed_data, uploaded_at)
       VALUES ($1, $2, $3, $4, $5, $6, NOW())
       ON CONFLICT (id) DO UPDATE SET
         filename = EXCLUDED.filename,
         file_url = EXCLUDED.file_url,
         file_type = EXCLUDED.file_type,
         parsed_data = EXCLUDED.parsed_data,
         uploaded_at = NOW()`,
      [
        resumeId,
        userRow.id,
        profile.resume.filename,
        `/uploads/${userRow.id}/${profile.resume.filename}`,
        profile.resume.fileType,
        JSON.stringify(profile.resume.parsedData),
      ],
    );

    const jobId = uuidv4();
    await query(
      `INSERT INTO job_descriptions (id, user_id, title, company, raw_text, source_url, parsed_data, scraped_at, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
       ON CONFLICT (id) DO UPDATE SET
         title = EXCLUDED.title,
         company = EXCLUDED.company,
         raw_text = EXCLUDED.raw_text,
         source_url = EXCLUDED.source_url,
         parsed_data = EXCLUDED.parsed_data,
         scraped_at = NOW()`,
      [
        jobId,
        userRow.id,
        profile.job.title,
        profile.job.company,
        profile.job.rawText,
        profile.job.sourceUrl,
        JSON.stringify(profile.job.parsedData),
      ],
    );

    const analysisId = uuidv4();
    await query(
      `INSERT INTO analyses (
        id, user_id, resume_id, job_description_id, status, overall_score,
        resume_strength_score, ats_score, seniority, peer_percentile, created_at, completed_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW(), NOW())
      ON CONFLICT (id) DO UPDATE SET
        user_id = EXCLUDED.user_id,
        resume_id = EXCLUDED.resume_id,
        job_description_id = EXCLUDED.job_description_id,
        status = EXCLUDED.status,
        overall_score = EXCLUDED.overall_score,
        resume_strength_score = EXCLUDED.resume_strength_score,
        ats_score = EXCLUDED.ats_score,
        seniority = EXCLUDED.seniority,
        peer_percentile = EXCLUDED.peer_percentile,
        completed_at = NOW()`,
      [
        analysisId,
        userRow.id,
        resumeId,
        jobId,
        profile.analysis.status,
        profile.analysis.overallScore,
        profile.analysis.resumeStrengthScore,
        profile.analysis.atsScore,
        profile.analysis.seniority,
        profile.analysis.peerPercentile,
      ],
    );

    await query('DELETE FROM analysis_steps WHERE analysis_id = $1', [analysisId]);
    const analysisSteps = [
      {
        label: 'Resume Parsing',
        status: 'complete',
        message: 'Resume parsed and normalized for analysis.',
      },
      {
        label: 'Market Benchmarking',
        status: 'complete',
        message: 'Benchmarked against current job market expectations.',
      },
      {
        label: 'Skill Gap Analysis',
        status: 'complete',
        message: 'Identified strengths and missing competencies.',
      },
      {
        label: 'Roadmap Generation',
        status: 'complete',
        message: 'Generated a targeted learning roadmap.',
      },
    ];

    for (const step of analysisSteps) {
      await query(
        `INSERT INTO analysis_steps (id, analysis_id, label, status, started_at, completed_at, message)
         VALUES ($1, $2, $3, $4, NOW(), NOW(), $5)`,
        [uuidv4(), analysisId, step.label, step.status, step.message],
      );
    }

    await query('DELETE FROM skill_gaps WHERE analysis_id = $1', [analysisId]);
    for (const gap of profile.analysis.skillGaps) {
      await query(
        `INSERT INTO skill_gaps (
          id, analysis_id, skill, category, status, severity, confidence,
          resume_version, required_version, radar_score, market_demand, trend_delta
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
        [
          uuidv4(),
          analysisId,
          gap.skill,
          gap.category,
          gap.status,
          gap.severity,
          gap.confidence,
          gap.resumeVersion,
          gap.requiredVersion,
          gap.radarScore,
          gap.marketDemand,
          gap.trendDelta,
        ],
      );
    }

    const roadmapId = uuidv4();
    await query(
      `INSERT INTO roadmaps (
        id, analysis_id, user_id, title, total_weeks, total_hours, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
      ON CONFLICT (id) DO UPDATE SET
        analysis_id = EXCLUDED.analysis_id,
        user_id = EXCLUDED.user_id,
        title = EXCLUDED.title,
        total_weeks = EXCLUDED.total_weeks,
        total_hours = EXCLUDED.total_hours,
        updated_at = NOW()`,
      [
        roadmapId,
        analysisId,
        userRow.id,
        profile.analysis.roadmap.title,
        profile.analysis.roadmap.totalWeeks,
        profile.analysis.roadmap.totalHours,
      ],
    );

    await query(
      `UPDATE analyses SET roadmap_id = $1 WHERE id = $2`,
      [roadmapId, analysisId],
    );

    await query('DELETE FROM roadmap_milestones WHERE roadmap_id = $1', [roadmapId]);
    for (const milestone of profile.analysis.roadmap.milestones) {
      const milestoneId = uuidv4();
      await query(
        `INSERT INTO roadmap_milestones (
          id, roadmap_id, week, title, description, skills, estimated_hours, status, completed_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, 'complete', NOW())`,
        [
          milestoneId,
          roadmapId,
          milestone.week,
          milestone.title,
          milestone.description,
          JSON.stringify(milestone.skills),
          milestone.estimatedHours,
        ],
      );

      await query('DELETE FROM learning_resources WHERE milestone_id = $1', [milestoneId]);
      for (const resource of milestone.resources) {
        await query(
          `INSERT INTO learning_resources (
            id, milestone_id, title, url, type, provider, estimated_hours, is_free, rating
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
          [
            uuidv4(),
            milestoneId,
            resource.title,
            resource.url,
            resource.type,
            resource.provider,
            resource.estimatedHours,
            resource.isFree,
            resource.rating,
          ],
        );
      }
    }

    await query('DELETE FROM feedback WHERE analysis_id = $1', [analysisId]);
    await query(
      `INSERT INTO feedback (id, analysis_id, user_id, rating, comment, created_at)
       VALUES ($1, $2, $3, $4, $5, NOW())`,
      [
        uuidv4(),
        analysisId,
        userRow.id,
        5,
        'Useful baseline analysis with realistic gaps and roadmap milestones.',
      ],
    );
  }

  console.log('✅ Seeded Skill Taxonomy');
  console.log('✅ Seeded sample users');
  console.log('✅ Seeded resumes, jobs, analyses, and roadmaps');
  console.log(`🔐 Sample password for all seeded users: ${SAMPLE_PASSWORD}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
