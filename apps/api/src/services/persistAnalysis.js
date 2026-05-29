/**
 * Persists LangGraph pipeline output to raw SQL tables used by Dashboard,
 * progress, benchmark, and analysis detail endpoints.
 */

import { v4 as uuidv4 } from "uuid";
import { query } from "../core/database.js";
import { getEmbedding } from "./transformerModels.js";
import { recordCareerSnapshot } from "./careerMemory.js";

function parseEstimatedWeeks(estimatedTime) {
  if (!estimatedTime) return 2;
  const m = String(estimatedTime).match(/(\d+)/);
  return m ? Math.max(1, parseInt(m[1], 10)) : 2;
}

/**
 * @param {string} userId
 * @param {string} resumeText
 * @param {string} jobDescriptionText
 * @param {Record<string, unknown>} state - LangGraph final state
 * @returns {Promise<string>} analysisId
 */
export async function persistAnalysisResult(
  userId,
  resumeText,
  jobDescriptionText,
  state,
) {
  const analysisId = uuidv4();
  const resumeId = uuidv4();
  const jdId = uuidv4();

  const resumeData = state.resumeData || {};
  const jdData = state.jdData || {};
  const gapAnalysis = state.gapAnalysis || {};
  const roadmap = state.roadmap || {};
  const normalizedSkills = state.normalizedSkills || [];

  const candidateName =
    resumeData.personalInfo?.name ||
    resumeData.name ||
    "Uploaded Resume";

  const jdTitle = jdData.title || "Target Role";
  const jdCompany = jdData.company || null;

  const matchPct = Number(gapAnalysis.matchPercentage) || 0;
  const atsScore =
    state.atsOptimization?.atsScore ??
    state.atsOptimization?.score ??
    Math.min(100, matchPct + 5);

  const jdSkillNames = (jdData.requiredSkills || []).map((s) =>
    typeof s === "string" ? s : s.name,
  );
  const missing = gapAnalysis.missingSkills || [];
  const critical = gapAnalysis.criticalGaps || [];
  const missingSet = new Set(
    [...missing, ...critical].map((s) => String(s).toLowerCase()),
  );
  const matchedSkills =
    gapAnalysis.matchedSkills?.length > 0
      ? gapAnalysis.matchedSkills
      : jdSkillNames.filter((s) => s && !missingSet.has(String(s).toLowerCase()));

  const gapPayload = {
    missingSkills: missing,
    matchedSkills,
    criticalGaps: critical,
    matchPercentage: matchPct,
    experienceGap: gapAnalysis.experienceGap || null,
  };

  let resumeEmbedding = null;
  let jdEmbedding = null;
  try {
    const skillText = normalizedSkills.length
      ? normalizedSkills.join(", ")
      : (resumeData.skills || []).map((s) => s.name || s).join(", ");
    if (skillText) {
      resumeEmbedding = await getEmbedding(skillText);
    }
    if (jobDescriptionText?.length > 20) {
      jdEmbedding = await getEmbedding(jobDescriptionText.substring(0, 3000));
    }
  } catch (e) {
    console.warn("Embedding generation skipped:", e.message);
  }

  await query(
    `INSERT INTO resumes (id, user_id, filename, file_url, file_type, parsed_data, embedding_json, uploaded_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())`,
    [
      resumeId,
      userId,
      `${candidateName.replace(/\s+/g, "_")}_resume.txt`,
      "",
      "text/plain",
      JSON.stringify(resumeData),
      resumeEmbedding ? JSON.stringify(resumeEmbedding) : null,
    ],
  );

  await query(
    `INSERT INTO job_descriptions (id, user_id, title, company, raw_text, parsed_data, embedding_json, created_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())`,
    [
      jdId,
      userId,
      jdTitle,
      jdCompany,
      jobDescriptionText || "",
      JSON.stringify(jdData),
      jdEmbedding ? JSON.stringify(jdEmbedding) : null,
    ],
  );

  await query(
    `INSERT INTO analyses (
       id, user_id, resume_id, job_description_id, status,
       overall_score, resume_strength_score, ats_score, seniority,
       gap_analysis, normalized_skills, created_at, completed_at
     ) VALUES ($1, $2, $3, $4, 'complete', $5, $6, $7, $8, $9, $10, NOW(), NOW())`,
    [
      analysisId,
      userId,
      resumeId,
      jdId,
      matchPct,
      Math.min(100, matchPct + 10),
      typeof atsScore === "number" ? atsScore : matchPct,
      "mid",
      JSON.stringify(gapPayload),
      JSON.stringify(normalizedSkills),
    ],
  );

  for (const skill of gapAnalysis.missingSkills || []) {
    await query(
      `INSERT INTO skill_gaps (id, analysis_id, skill, category, status, severity, confidence, radar_score, market_demand, trend_delta)
       VALUES ($1, $2, $3, $4, 'missing', 'high', 0.85, 30, 75, 5)`,
      [uuidv4(), analysisId, skill, "technical"],
    );
  }

  for (const skill of gapAnalysis.criticalGaps || []) {
    if ((gapAnalysis.missingSkills || []).includes(skill)) continue;
    await query(
      `INSERT INTO skill_gaps (id, analysis_id, skill, category, status, severity, confidence, radar_score, market_demand, trend_delta)
       VALUES ($1, $2, $3, $4, 'missing', 'critical', 0.95, 15, 85, 8)`,
      [uuidv4(), analysisId, skill, "technical"],
    );
  }

  for (const skill of matchedSkills) {
    await query(
      `INSERT INTO skill_gaps (id, analysis_id, skill, category, status, severity, confidence, radar_score, market_demand, trend_delta)
       VALUES ($1, $2, $3, $4, 'matched', 'low', 0.9, 85, 60, 0)`,
      [uuidv4(), analysisId, skill, "technical"],
    );
  }

  // If LLM did not return matched/missing lists, derive from JD skills
  if (
    !(gapAnalysis.missingSkills?.length) &&
    !(gapAnalysis.matchedSkills?.length) &&
    jdData.requiredSkills?.length
  ) {
    for (const req of jdData.requiredSkills) {
      const name = req.name || req;
      const isMatch = matchedSet.has(String(name).toLowerCase());
      await query(
        `INSERT INTO skill_gaps (id, analysis_id, skill, category, status, severity, confidence, radar_score)
         VALUES ($1, $2, $3, 'technical', $4, $5, 0.8, $6)`,
        [
          uuidv4(),
          analysisId,
          name,
          isMatch ? "matched" : "missing",
          isMatch ? "low" : "high",
          isMatch ? 85 : 25,
        ],
      );
    }
  }

  const steps = roadmap.steps || [];
  if (steps.length > 0) {
    const roadmapId = uuidv4();
    const totalWeeks = steps.reduce(
      (sum, s) => sum + parseEstimatedWeeks(s.estimatedTime),
      0,
    );

    await query(
      `INSERT INTO roadmaps (id, analysis_id, user_id, title, total_weeks, total_hours, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, NOW())`,
      [
        roadmapId,
        analysisId,
        userId,
        "Personalized Learning Roadmap",
        totalWeeks || steps.length,
        (totalWeeks || steps.length) * 10,
      ],
    );

    let week = 1;
    for (const step of steps) {
      const milestoneId = uuidv4();
      const weeks = parseEstimatedWeeks(step.estimatedTime);
      await query(
        `INSERT INTO roadmap_milestones (id, roadmap_id, week, title, description, skills, estimated_hours, status)
         VALUES ($1, $2, $3, $4, $5, $6, $7, 'not_started')`,
        [
          milestoneId,
          roadmapId,
          week,
          step.title || "Learning step",
          step.description || "",
          JSON.stringify(
            (gapAnalysis.missingSkills || []).slice(0, 3).length
              ? gapAnalysis.missingSkills.slice(0, 3)
              : ["skills"],
          ),
          weeks * 10,
        ],
      );
      week += weeks;
    }

    await query("UPDATE analyses SET roadmap_id = $1 WHERE id = $2", [
      roadmapId,
      analysisId,
    ]);
  }

  await query(
    `UPDATE users SET analyses_used = analyses_used + 1 WHERE id = $1`,
    [userId],
  );

  await recordCareerSnapshot({
    userId,
    analysisId,
    targetRole: jdTitle,
    targetCompany: jdCompany,
    overallScore: matchPct,
    atsScore: typeof atsScore === "number" ? atsScore : matchPct,
    resumeStrengthScore: Math.min(100, matchPct + 10),
    normalizedSkills,
    matchedSkills,
    missingSkills: missing,
  });

  return analysisId;
}
