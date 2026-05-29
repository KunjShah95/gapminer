/**
 * Longitudinal career memory — snapshots per analysis + per-skill evolution.
 */

import { v4 as uuidv4 } from "uuid";
import { query } from "../core/database.js";

/**
 * Record a career snapshot and update skill evolution after an analysis completes.
 */
export async function recordCareerSnapshot({
  userId,
  analysisId,
  targetRole,
  targetCompany,
  overallScore,
  atsScore,
  resumeStrengthScore,
  normalizedSkills = [],
  matchedSkills = [],
  missingSkills = [],
}) {
  const snapshotId = uuidv4();
  const allSkills = [
    ...new Set(
      [
        ...normalizedSkills.map((s) =>
          typeof s === "string" ? s : s.canonicalName || s.name || String(s),
        ),
        ...matchedSkills,
        ...missingSkills,
      ].filter(Boolean),
    ),
  ];

  await query(
    `INSERT INTO career_snapshots (
       id, user_id, analysis_id, target_role, target_company,
       overall_score, ats_score, resume_strength_score,
       skills, matched_skills, missing_skills, created_at
     ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,NOW())`,
    [
      snapshotId,
      userId,
      analysisId,
      targetRole || null,
      targetCompany || null,
      overallScore ?? null,
      atsScore ?? null,
      resumeStrengthScore ?? null,
      JSON.stringify(allSkills),
      JSON.stringify(matchedSkills),
      JSON.stringify(missingSkills),
    ],
  );

  for (const skill of allSkills) {
    const key = String(skill).trim();
    if (!key) continue;

    const isMissing = missingSkills.some(
      (m) => m.toLowerCase() === key.toLowerCase(),
    );
    const isMatched = matchedSkills.some(
      (m) => m.toLowerCase() === key.toLowerCase(),
    );

    await query(
      `INSERT INTO skill_evolution (
         id, user_id, skill_name, status, first_seen_at, last_seen_at,
         appearance_count, was_missing_count, was_matched_count
       ) VALUES ($1, $2, $3, $4, NOW(), NOW(), 1, $5, $6)
       ON CONFLICT (user_id, skill_name) DO UPDATE SET
         last_seen_at = NOW(),
         appearance_count = skill_evolution.appearance_count + 1,
         was_missing_count = skill_evolution.was_missing_count + $5,
         was_matched_count = skill_evolution.was_matched_count + $6,
         status = CASE
           WHEN $6 > 0 AND skill_evolution.was_missing_count > 0 THEN 'improved'
           WHEN $5 > 0 THEN 'gap'
           ELSE skill_evolution.status
         END`,
      [
        uuidv4(),
        userId,
        key,
        isMissing ? "gap" : isMatched ? "strength" : "tracked",
        isMissing ? 1 : 0,
        isMatched ? 1 : 0,
      ],
    );
  }

  return snapshotId;
}

/**
 * Full career memory payload for UI.
 */
export async function getCareerMemory(userId, { limit = 20 } = {}) {
  const { rows: snapshots } = await query(
    `SELECT id, analysis_id, target_role, target_company,
            overall_score, ats_score, resume_strength_score,
            skills, matched_skills, missing_skills, created_at
     FROM career_snapshots
     WHERE user_id = $1
     ORDER BY created_at DESC
     LIMIT $2`,
    [userId, limit],
  );

  const { rows: evolution } = await query(
    `SELECT skill_name, status, first_seen_at, last_seen_at,
            appearance_count, was_missing_count, was_matched_count
     FROM skill_evolution
     WHERE user_id = $1
     ORDER BY last_seen_at DESC
     LIMIT 100`,
    [userId],
  );

  const timeline = snapshots
    .slice()
    .reverse()
    .map((s) => ({
      id: s.id,
      analysisId: s.analysis_id,
      date: s.created_at,
      targetRole: s.target_role,
      targetCompany: s.target_company,
      overallScore: s.overall_score,
      atsScore: s.ats_score,
      resumeStrengthScore: s.resume_strength_score,
      matchedCount: Array.isArray(s.matched_skills)
        ? s.matched_skills.length
        : (s.matched_skills || []).length,
      missingCount: Array.isArray(s.missing_skills)
        ? s.missing_skills.length
        : (s.missing_skills || []).length,
    }));

  const improvedSkills = evolution.filter((e) => e.status === "improved");
  const persistentGaps = evolution.filter(
    (e) => e.status === "gap" && e.was_missing_count >= 2,
  );
  const strengths = evolution.filter((e) => e.status === "strength");

  let scoreDelta = 0;
  if (snapshots.length >= 2) {
    scoreDelta =
      (snapshots[0].overall_score || 0) - (snapshots[1].overall_score || 0);
  }

  return {
    snapshots: snapshots.map((s) => ({
      ...s,
      skills:
        typeof s.skills === "string" ? JSON.parse(s.skills) : s.skills || [],
      matched_skills:
        typeof s.matched_skills === "string"
          ? JSON.parse(s.matched_skills)
          : s.matched_skills || [],
      missing_skills:
        typeof s.missing_skills === "string"
          ? JSON.parse(s.missing_skills)
          : s.missing_skills || [],
    })),
    timeline,
    skillEvolution: evolution,
    insights: {
      totalAnalyses: snapshots.length,
      scoreDelta,
      improvedSkills: improvedSkills.map((s) => s.skill_name),
      persistentGaps: persistentGaps.map((s) => s.skill_name),
      topStrengths: strengths
        .sort((a, b) => b.was_matched_count - a.was_matched_count)
        .slice(0, 10)
        .map((s) => s.skill_name),
    },
  };
}

/**
 * Backfill career memory from existing completed analyses (idempotent per analysis).
 */
export async function backfillCareerMemory(userId) {
  const { rows: analyses } = await query(
    `SELECT a.id, a.overall_score, a.ats_score, a.resume_strength_score,
            a.gap_analysis, a.normalized_skills, a.created_at,
            j.title AS target_role, j.company AS target_company
     FROM analyses a
     LEFT JOIN job_descriptions j ON j.id = a.job_description_id
     WHERE a.user_id = $1 AND a.status = 'complete'
     ORDER BY a.created_at ASC`,
    [userId],
  );

  let created = 0;
  for (const a of analyses) {
    const { rows: existing } = await query(
      "SELECT id FROM career_snapshots WHERE analysis_id = $1",
      [a.id],
    );
    if (existing.length) continue;

    const gap =
      typeof a.gap_analysis === "string"
        ? JSON.parse(a.gap_analysis)
        : a.gap_analysis || {};
    const normalized =
      typeof a.normalized_skills === "string"
        ? JSON.parse(a.normalized_skills)
        : a.normalized_skills || [];

    await recordCareerSnapshot({
      userId,
      analysisId: a.id,
      targetRole: a.target_role,
      targetCompany: a.target_company,
      overallScore: a.overall_score,
      atsScore: a.ats_score,
      resumeStrengthScore: a.resume_strength_score,
      normalizedSkills: normalized,
      matchedSkills: gap.matchedSkills || [],
      missingSkills: gap.missingSkills || [],
    });
    created += 1;
  }

  return { backfilled: created };
}
