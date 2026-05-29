/**
 * Lightweight smoke tests (no LLM calls).
 * Run: node --import tsx src/scripts/smoke-test.js
 */
import "dotenv/config";
import { initDb, query, hasPgVector } from "../core/database.js";

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
  console.log("Gapminer API smoke tests\n");

  await initDb();

  const tables = await query(
    `SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tablename = ANY($1::text[])`,
    [
      [
        "users",
        "analyses",
        "job_applications",
        "resume_versions",
        "career_snapshots",
        "skill_evolution",
      ],
    ],
  );
  const found = new Set(tables.rows.map((r) => r.tablename));
  for (const t of [
    "users",
    "analyses",
    "job_applications",
    "resume_versions",
    "career_snapshots",
    "skill_evolution",
  ]) {
    assert(found.has(t), `table exists: ${t}`);
  }

  const cols = await query(
    `SELECT column_name FROM information_schema.columns
     WHERE table_schema = 'public' AND table_name = 'analyses'
       AND column_name IN ('gap_analysis', 'normalized_skills')`,
  );
  assert(cols.rows.length === 2, "analyses has gap_analysis + normalized_skills");

  console.log(`\npgvector native: ${hasPgVector() ? "yes" : "no (JSONB fallback)"}`);
  console.log(`\n${passed} passed, ${failed} failed`);
  process.exit(failed > 0 ? 1 : 0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
