/**
 * Seed 100+ salary benchmarks from Adzuna API data.
 * Run: node src/scripts/seedSalaryBenchmarks.js
 */
import { prisma } from "../core/database.js";
import { searchJobs, extractSalaryRange } from "../services/jobBoardApi.js";
import "dotenv/config";

const ROLES_TO_SEED = [
  { title: "software engineer", tier: "mid" },
  { title: "senior software engineer", tier: "mid" },
  { title: "staff software engineer", tier: "mid" },
  { title: "frontend developer", tier: "mid" },
  { title: "backend developer", tier: "mid" },
  { title: "full stack developer", tier: "mid" },
  { title: "data scientist", tier: "mid" },
  { title: "data engineer", tier: "mid" },
  { title: "machine learning engineer", tier: "mid" },
  { title: "devops engineer", tier: "mid" },
  { title: "site reliability engineer", tier: "mid" },
  { title: "cloud engineer", tier: "mid" },
  { title: "security engineer", tier: "mid" },
  { title: "product manager", tier: "mid" },
  { title: "engineering manager", tier: "mid" },
  { title: "cto", tier: "mid" },
  { title: "vp engineering", tier: "mid" },
  { title: "technical lead", tier: "mid" },
  { title: "solutions architect", tier: "mid" },
  { title: "systems administrator", tier: "mid" },
  { title: "network engineer", tier: "mid" },
  { title: "database administrator", tier: "mid" },
  { title: "qa engineer", tier: "mid" },
  { title: "android developer", tier: "mid" },
  { title: "ios developer", tier: "mid" },
  { title: "platform engineer", tier: "mid" },
  { title: "infrastructure engineer", tier: "mid" },
];

const EXP_BUCKETS = [
  { key: "0-1", min: 0, max: 1 },
  { key: "1-3", min: 1, max: 3 },
  { key: "3-5", min: 3, max: 5 },
  { key: "5-10", min: 5, max: 10 },
  { key: "10+", min: 10, max: 20 },
];

const LOCATIONS = [
  "London, UK",
  "Manchester, UK",
  "Birmingham, UK",
  "Edinburgh, UK",
  "Bristol, UK",
  "Leeds, UK",
  "Glasgow, UK",
  "Liverpool, UK",
  "New York, USA",
  "San Francisco, USA",
  "Seattle, USA",
  "Austin, USA",
  "Boston, USA",
  "Chicago, USA",
  "Los Angeles, USA",
  "Berlin, Germany",
  "Munich, Germany",
  "Amsterdam, Netherlands",
  "Dublin, Ireland",
  "Toronto, Canada",
  "Vancouver, Canada",
  "Sydney, Australia",
  "Melbourne, Australia",
  "Singapore",
  "Bangalore, India",
  "Tokyo, Japan",
];

const TIER_MULTIPLIERS = {
  faang: 1.4,
  "faang+": 1.25,
  mid: 1.0,
  startup: 0.85,
};

function estimateYearsMultiplier(years) {
  if (years < 1) return 0.6;
  if (years < 3) return 0.8;
  if (years < 5) return 1.0;
  if (years < 10) return 1.25;
  return 1.5;
}

async function seed() {
  console.log("🌱 Seeding salary benchmarks from Adzuna data...");
  let total = 0;

  for (const role of ROLES_TO_SEED) {
    console.log(`  Fetching jobs for "${role.title}"...`);
    const jobs = await searchJobs(role.title, "", 1);

    if (jobs.length === 0) {
      console.log(`    No results for "${role.title}", skipping`);
      continue;
    }

    const baseRange = extractSalaryRange(jobs);
    if (baseRange.sampleSize === 0) {
      console.log(`    No salary data for "${role.title}", skipping`);
      continue;
    }

    for (const location of LOCATIONS.slice(0, 3)) {
      for (const exp of EXP_BUCKETS) {
        for (const [tierName, multiplier] of Object.entries(TIER_MULTIPLIERS)) {
          const expMult = estimateYearsMultiplier(exp.min);
          const base = Math.round(baseRange.median * multiplier * expMult);
          const minSalary = Math.round(base * 0.8);
          const maxSalary = Math.round(base * 1.3);
          const tcMin = Math.round(base * 0.9);
          const tcMedian = Math.round(base * 1.15);
          const tcMax = Math.round(base * 1.5);

          try {
            await prisma.salaryBenchmark.upsert({
              where: {
                roleTitle_location_companyTier_yearsExperience: {
                  roleTitle: role.title,
                  location,
                  companyTier: tierName,
                  yearsExperience: exp.key,
                },
              },
              create: {
                companyTier: tierName,
                roleTitle: role.title,
                location,
                minSalary,
                medianSalary: base,
                maxSalary,
                totalCompMin: tcMin,
                totalCompMedian: tcMedian,
                totalCompMax: tcMax,
                yearsExperience: exp.key,
                dataSource: "adzuna",
                sampleSize: baseRange.sampleSize,
              },
              update: {
                minSalary,
                medianSalary: base,
                maxSalary,
                totalCompMin: tcMin,
                totalCompMedian: tcMedian,
                totalCompMax: tcMax,
                sampleSize: baseRange.sampleSize,
              },
            });
            total++;
          } catch (err) {
            console.error(`    Error upserting ${role.title}/${location}/${tierName}:`, err.message);
          }
        }
      }
    }
    console.log(`    ✅ ${role.title} — ${jobs.length} jobs found, ${baseRange.sampleSize} with salary`);
  }

  console.log(`\n✅ Seeded ${total} salary benchmark records`);
  await prisma.$disconnect();
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
