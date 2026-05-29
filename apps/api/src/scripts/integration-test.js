/**
 * Integration tests (no LLM). Run: npm run test:integration
 */
import "dotenv/config";
import { initDb, query } from "../core/database.js";
import { persistAnalysisResult } from "../services/persistAnalysis.js";
import {
  recordCareerSnapshot,
  getCareerMemory,
  backfillCareerMemory,
} from "../services/careerMemory.js";
import {
  generateSkillTrendData,
  getTopTrendingSkills,
  hashUnit,
  resolveSkillTrend,
} from "../services/marketDemand.js";
import { v4 as uuidv4 } from "uuid";

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    passed += 1;
    console.log(`  ✅ ${message}`);
  } else {
    failed += 1;
    console.error(`  ❌ ${message}`);
  }
}

async function main() {
  console.log("Gapminer integration tests\n");
  await initDb();

  // Deterministic market demand
  const a = generateSkillTrendData("Python", "stable", 90);
  const b = generateSkillTrendData("Python", "stable", 90);
  assert(
    JSON.stringify(a) === JSON.stringify(b),
    "generateSkillTrendData is deterministic",
  );
  assert(hashUnit("test") === hashUnit("test"), "hashUnit is stable");

  const trends = await getTopTrendingSkills(undefined, 5);
  assert(trends.length >= 5, "getTopTrendingSkills returns catalog skills");
  assert(!trends.some((t) => t.demandScore > 100), "demand scores bounded");

  const react = await resolveSkillTrend("React");
  assert(react.skill === "React", "resolveSkillTrend hits catalog");
  assert(react.source === "catalog", "React from catalog");

  // persistAnalysis (needs a user)
  const { rows: users } = await query(
    "SELECT id FROM users ORDER BY created_at DESC LIMIT 1",
  );
  if (users[0]) {
    const userId = users[0].id;
    const mockState = {
      resumeData: {
        personalInfo: { name: "Test User" },
        skills: [{ name: "Python" }, { name: "React" }],
        workExperience: [],
        yearsOfExperience: 3,
      },
      jdData: {
        title: "Backend Engineer",
        requiredSkills: [
          { name: "Python", importance: "Required" },
          { name: "Kubernetes", importance: "Required" },
        ],
        requiredYearsOfExperience: 3,
      },
      gapAnalysis: {
        missingSkills: ["Kubernetes"],
        criticalGaps: ["Kubernetes"],
        matchedSkills: ["Python"],
        matchPercentage: 50,
        experienceGap: "Minor gap",
      },
      normalizedSkills: ["Python", "React"],
      roadmap: {
        steps: [
          {
            title: "Learn Kubernetes",
            description: "Study K8s basics",
            estimatedTime: "2 weeks",
          },
        ],
      },
    };

    const analysisId = await persistAnalysisResult(
      userId,
      "Python developer with React experience",
      "We need Python and Kubernetes skills for backend role",
      mockState,
    );

    const { rows: saved } = await query(
      "SELECT id, status, gap_analysis, normalized_skills FROM analyses WHERE id = $1",
      [analysisId],
    );
    assert(saved[0]?.status === "complete", "persistAnalysis sets status complete");
    assert(saved[0]?.gap_analysis != null, "persistAnalysis stores gap_analysis");

    const { rows: gaps } = await query(
      "SELECT COUNT(*)::int AS c FROM skill_gaps WHERE analysis_id = $1",
      [analysisId],
    );
    assert(gaps[0].c >= 1, "persistAnalysis creates skill_gaps rows");

    const { rows: careerRows } = await query(
      "SELECT id FROM career_snapshots WHERE analysis_id = $1",
      [analysisId],
    );
    assert(careerRows.length === 1, "persistAnalysis records career snapshot");

    await query("DELETE FROM career_snapshots WHERE analysis_id = $1", [
      analysisId,
    ]);
    await query("DELETE FROM skill_gaps WHERE analysis_id = $1", [analysisId]);
    await query("DELETE FROM analyses WHERE id = $1", [analysisId]);

    await recordCareerSnapshot({
      userId,
      analysisId: null,
      targetRole: "Engineer",
      overallScore: 70,
      matchedSkills: ["Python"],
      missingSkills: ["Kubernetes"],
      normalizedSkills: ["Python", "React"],
    });
    const memory = await getCareerMemory(userId);
    assert(memory.snapshots.length >= 1, "career memory has snapshots");
    assert(memory.insights != null, "career memory has insights");
  } else {
    console.log("  ⚠️  Skipping persistAnalysis test (no users in DB)");
  }

  // job_applications table writable
  const testUser = users[0]?.id;
  if (testUser) {
    const appId = uuidv4();
    await query(
      `INSERT INTO job_applications (id, user_id, company, role, status)
       VALUES ($1, $2, 'Test Co', 'Engineer', 'saved')`,
      [appId, testUser],
    );
    const { rows } = await query(
      "SELECT id FROM job_applications WHERE id = $1",
      [appId],
    );
    assert(rows.length === 1, "job_applications insert works");
    await query("DELETE FROM job_applications WHERE id = $1", [appId]);
  }

  console.log(`\n${passed} passed, ${failed} failed`);
  process.exit(failed > 0 ? 1 : 0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
