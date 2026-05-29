/**
 * Job–resume matching using stored embeddings + pg_cosine_similarity / vector ops.
 */

import { query, hasPgVector } from "../core/database.js";
import {
  getEmbedding,
  cosineSimilarity,
  extractSkills,
} from "./transformerModels.js";

function parseEmbedding(value) {
  if (!value) return null;
  if (Array.isArray(value)) return value;
  if (typeof value === "string") {
    try {
      return JSON.parse(value);
    } catch {
      return null;
    }
  }
  return null;
}

/**
 * Rank job descriptions for a user by semantic similarity to resume text.
 */
export async function rankJobsForResume(userId, resumeText, { limit = 20 } = {}) {
  const skills = await extractSkills(resumeText);
  const userEmbedding = await getEmbedding(
    skills.length ? skills.join(", ") : resumeText.substring(0, 2000),
  );
  const embJson = JSON.stringify(userEmbedding);

  let rows;

  if (hasPgVector()) {
    const res = await query(
      `SELECT j.id, j.title, j.company, j.raw_text, j.source_url, j.user_id, j.created_at,
              CASE WHEN j.user_id = $2 THEN 1 ELSE 0 END AS is_saved,
              1 - (j.embedding <=> $1::vector) AS score
       FROM job_descriptions j
       WHERE j.raw_text IS NOT NULL AND j.raw_text != ''
         AND j.embedding IS NOT NULL
       ORDER BY score DESC
       LIMIT $3`,
      [embJson, userId, Math.min(limit * 3, 50)],
    );
    rows = res.rows;
  } else {
    const res = await query(
      `SELECT j.id, j.title, j.company, j.raw_text, j.source_url, j.user_id, j.created_at,
              CASE WHEN j.user_id = $2 THEN 1 ELSE 0 END AS is_saved,
              pg_cosine_similarity(j.embedding_json, $1::jsonb) AS score
       FROM job_descriptions j
       WHERE j.raw_text IS NOT NULL AND j.raw_text != ''
         AND j.embedding_json IS NOT NULL
       ORDER BY score DESC NULLS LAST
       LIMIT $3`,
      [embJson, userId, Math.min(limit * 3, 50)],
    );
    rows = res.rows;

    if (rows.length === 0) {
      const fallback = await query(
        `SELECT j.*
         FROM job_descriptions j
         WHERE j.raw_text IS NOT NULL AND j.raw_text != ''
         ORDER BY j.created_at DESC
         LIMIT 50`,
        [],
      );
      rows = fallback.rows.map((j) => ({ ...j, score: null, is_saved: j.user_id === userId ? 1 : 0 }));
    }
  }

  const recommendations = [];

  for (const job of rows) {
    try {
      let score = Number(job.score);
      if (!Number.isFinite(score)) {
        const stored = parseEmbedding(job.embedding_json);
        if (stored?.length) {
          score = cosineSimilarity(userEmbedding, stored);
        } else {
          const jobSkills = await extractSkills(job.raw_text.substring(0, 3000));
          const jobEmbedding = await getEmbedding(jobSkills.join(", ") || job.raw_text.substring(0, 500));
          score = cosineSimilarity(userEmbedding, jobEmbedding);
          await query(
            `UPDATE job_descriptions SET embedding_json = $1 WHERE id = $2`,
            [JSON.stringify(jobEmbedding), job.id],
          );
        }
      }

      const jobSkills = await extractSkills(job.raw_text.substring(0, 3000));
      const sharedSkills = skills.filter((s) =>
        jobSkills.some((js) => js.toLowerCase() === s.toLowerCase()),
      );
      const missingSkills = jobSkills.filter(
        (js) => !skills.some((s) => s.toLowerCase() === js.toLowerCase()),
      );

      recommendations.push({
        jobId: job.id,
        title: job.title || "Untitled Position",
        company: job.company || "Unknown",
        matchScore: Math.round(Math.min(1, Math.max(0, score)) * 100),
        sharedSkills: sharedSkills.slice(0, 5),
        missingSkills: missingSkills.slice(0, 5),
        url: job.source_url || null,
        isSaved: !!job.is_saved,
      });
    } catch {
      continue;
    }
  }

  recommendations.sort((a, b) => b.matchScore - a.matchScore);
  return {
    recommendations: recommendations.slice(0, limit),
    totalJobs: rows.length,
    userSkills: skills,
  };
}
