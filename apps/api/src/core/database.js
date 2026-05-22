// PostgreSQL connection pool using the `pg` driver
// Mirrors SQLAlchemy async engine + session from database.js

/* global console */
import pg from "pg";
import { config } from "./config.js";

const { Pool } = pg;

// Parse DATABASE_URL (strip asyncpg driver prefix if copy-pasted from Python config)
const connectionString = config.DATABASE_URL.replace(
  "postgresql+asyncpg://",
  "postgresql://",
);

export const pool = new Pool({
  connectionString,
  max: 10,
  idleTimeoutMillis: 30_000,
  connectionTimeoutMillis: 5_000,
});

pool.on("error", (err) => {
  console.error("Unexpected PostgreSQL pool error:", err);
});

/**
 * Execute a query and return all rows.
 * @param {string} text
 * @param {any[]} [params]
 */
export const query = (text, params) => pool.query(text, params);

/**
 * Get a dedicated client (for transactions).
 */
export const getClient = () => pool.connect();

/**
 * Run initDb migrations / table creation.
 * Equivalent to Base.metadata.create_all() in Python.
 */
export async function initDb() {
  let client;
  try {
    client = await pool.connect();
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        email TEXT UNIQUE NOT NULL,
        name TEXT NOT NULL,
        avatar TEXT,
        hashed_password TEXT,
        plan TEXT NOT NULL DEFAULT 'free',
        is_active BOOLEAN NOT NULL DEFAULT TRUE,
        is_verified BOOLEAN NOT NULL DEFAULT FALSE,
        google_id TEXT UNIQUE,
        github_id TEXT UNIQUE,
        provider TEXT DEFAULT 'internal',
        analyses_used INTEGER NOT NULL DEFAULT 0,
        analyses_limit INTEGER NOT NULL DEFAULT 3,
        two_factor_enabled BOOLEAN NOT NULL DEFAULT FALSE,
        two_factor_secret TEXT,
        password_reset_token TEXT,
        password_reset_expires TIMESTAMPTZ,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ
      );

      CREATE TABLE IF NOT EXISTS password_reset_tokens (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL REFERENCES users(id),
        token TEXT UNIQUE NOT NULL,
        expires_at TIMESTAMPTZ NOT NULL,
        used_at TIMESTAMPTZ,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS email_verification_tokens (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL REFERENCES users(id),
        token TEXT UNIQUE NOT NULL,
        expires_at TIMESTAMPTZ NOT NULL,
        used_at TIMESTAMPTZ,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS resumes (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL REFERENCES users(id),
        filename TEXT NOT NULL,
        file_url TEXT NOT NULL,
        file_type TEXT NOT NULL,
        parsed_data JSONB,
        uploaded_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS job_descriptions (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL REFERENCES users(id),
        title TEXT NOT NULL,
        company TEXT,
        raw_text TEXT NOT NULL,
        source_url TEXT,
        parsed_data JSONB,
        scraped_at TIMESTAMPTZ,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS roadmaps (
        id TEXT PRIMARY KEY,
        analysis_id TEXT NOT NULL,
        user_id TEXT NOT NULL REFERENCES users(id),
        title TEXT NOT NULL,
        total_weeks INTEGER NOT NULL DEFAULT 0,
        total_hours FLOAT NOT NULL DEFAULT 0,
        share_token TEXT UNIQUE,
        export_url TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ
      );

      CREATE TABLE IF NOT EXISTS analyses (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL REFERENCES users(id),
        resume_id TEXT NOT NULL REFERENCES resumes(id),
        job_description_id TEXT REFERENCES job_descriptions(id),
        status TEXT NOT NULL DEFAULT 'queued',
        overall_score FLOAT,
        resume_strength_score FLOAT,
        ats_score FLOAT,
        seniority TEXT,
        peer_percentile FLOAT,
        roadmap_id TEXT REFERENCES roadmaps(id),
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        completed_at TIMESTAMPTZ,
        feedback_rating INTEGER
      );

      CREATE TABLE IF NOT EXISTS analysis_steps (
        id TEXT PRIMARY KEY,
        analysis_id TEXT NOT NULL REFERENCES analyses(id) ON DELETE CASCADE,
        label TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'pending',
        started_at TIMESTAMPTZ,
        completed_at TIMESTAMPTZ,
        message TEXT
      );

      CREATE TABLE IF NOT EXISTS skill_gaps (
        id TEXT PRIMARY KEY,
        analysis_id TEXT NOT NULL REFERENCES analyses(id) ON DELETE CASCADE,
        skill TEXT NOT NULL,
        category TEXT NOT NULL,
        status TEXT NOT NULL,
        severity TEXT NOT NULL,
        confidence FLOAT NOT NULL DEFAULT 0,
        resume_version TEXT,
        required_version TEXT,
        radar_score FLOAT NOT NULL DEFAULT 0,
        market_demand FLOAT,
        trend_delta FLOAT
      );

      CREATE TABLE IF NOT EXISTS roadmap_milestones (
        id TEXT PRIMARY KEY,
        roadmap_id TEXT NOT NULL REFERENCES roadmaps(id) ON DELETE CASCADE,
        week INTEGER NOT NULL,
        title TEXT NOT NULL,
        description TEXT NOT NULL,
        skills JSONB NOT NULL,
        estimated_hours FLOAT NOT NULL DEFAULT 0,
        status TEXT NOT NULL DEFAULT 'not_started',
        completed_at TIMESTAMPTZ
      );

      CREATE TABLE IF NOT EXISTS learning_resources (
        id TEXT PRIMARY KEY,
        milestone_id TEXT NOT NULL REFERENCES roadmap_milestones(id) ON DELETE CASCADE,
        title TEXT NOT NULL,
        url TEXT NOT NULL,
        type TEXT NOT NULL,
        provider TEXT NOT NULL,
        estimated_hours FLOAT NOT NULL DEFAULT 0,
        is_free BOOLEAN NOT NULL DEFAULT TRUE,
        rating FLOAT
      );

      CREATE TABLE IF NOT EXISTS feedback (
        id TEXT PRIMARY KEY,
        analysis_id TEXT NOT NULL REFERENCES analyses(id),
        user_id TEXT NOT NULL REFERENCES users(id),
        rating INTEGER NOT NULL,
        comment TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS skills_taxonomy (
        id TEXT PRIMARY KEY,
        skill TEXT UNIQUE NOT NULL,
        category TEXT NOT NULL,
        synonyms JSONB,
        related_skills JSONB
      );
    `);

    await client.query(`
      ALTER TABLE users ADD COLUMN IF NOT EXISTS two_factor_enabled BOOLEAN NOT NULL DEFAULT FALSE;
      ALTER TABLE users ADD COLUMN IF NOT EXISTS two_factor_secret TEXT;
      ALTER TABLE users ADD COLUMN IF NOT EXISTS password_reset_token TEXT;
      ALTER TABLE users ADD COLUMN IF NOT EXISTS password_reset_expires TIMESTAMPTZ;
    `);

    // ── PL/pgSQL Vector Similarity Fallback ──
    // Creates a pure-SQL cosine similarity function for environments
    // where native pgvector (CREATE EXTENSION vector) is unavailable.
    // Operates on JSONB arrays of floats, returning DOUBLE PRECISION.
    await client.query(`
      CREATE OR REPLACE FUNCTION pg_cosine_similarity(a JSONB, b JSONB)
      RETURNS DOUBLE PRECISION AS $$
      DECLARE
          a_arr DOUBLE PRECISION[];
          b_arr DOUBLE PRECISION[];
          dot   DOUBLE PRECISION := 0;
          norm_a DOUBLE PRECISION := 0;
          norm_b DOUBLE PRECISION := 0;
          i     INT;
          len   INT;
      BEGIN
          SELECT ARRAY(SELECT jsonb_array_elements_text(a)::DOUBLE PRECISION) INTO a_arr;
          SELECT ARRAY(SELECT jsonb_array_elements_text(b)::DOUBLE PRECISION) INTO b_arr;

          len := cardinality(a_arr);
          IF len != cardinality(b_arr) OR len = 0 THEN
              RETURN 0;
          END IF;

          FOR i IN 1..len LOOP
              dot    := dot    + (a_arr[i] * b_arr[i]);
              norm_a := norm_a + (a_arr[i] * a_arr[i]);
              norm_b := norm_b + (b_arr[i] * b_arr[i]);
          END LOOP;

          IF norm_a = 0 OR norm_b = 0 THEN
              RETURN 0;
          END IF;

          RETURN dot / (sqrt(norm_a) * sqrt(norm_b));
      END;
      $$ LANGUAGE plpgsql IMMUTABLE;
    `);
    console.log("✅ pg_cosine_similarity fallback function created");

    // Detect native pgvector availability and cache the result
    try {
      await client.query("CREATE EXTENSION IF NOT EXISTS vector");
      _hasPgVector = true;
      console.log("✅ Native pgvector extension available");
    } catch {
      _hasPgVector = false;
      console.log("ℹ️  Native pgvector unavailable — using PL/pgSQL fallback");
    }

    console.log("✅ Database tables verified/created");
  } catch (err) {
    console.error("❌ Database init skipped or failed:", err.message);
  } finally {
    client?.release?.();
  }
}

// ── Vector Query Infrastructure ──
let _hasPgVector = null;

/**
 * Check whether native pgvector is available.
 * Safe to call before initDb() — returns false if not yet detected.
 */
export function hasPgVector() {
  return _hasPgVector === true;
}

/**
 * Run a cosine-similarity vector search against any table.
 * Automatically selects native pgvector operators or the PL/pgSQL fallback.
 *
 * @param {object} opts
 * @param {string} opts.table       - Table name (e.g. 'candidates')
 * @param {string} opts.column      - Column holding the embedding
 * @param {number[]} opts.embedding  - Query embedding array
 * @param {string[]} [opts.select]  - Additional columns to return (default: ['id'])
 * @param {number}   [opts.limit]   - Max results (default: 10)
 * @param {number}   [opts.threshold] - Minimum similarity score (default: 0)
 * @returns {Promise<Array<{id: string, score: number}>>}
 */
export async function vectorQuery({
  table,
  column,
  embedding,
  select = ["id"],
  limit = 10,
  threshold = 0,
}) {
  const selectCols = select.join(", ");
  const embJson = JSON.stringify(embedding);

  if (_hasPgVector) {
    // Native pgvector: column is type vector, use <=> cosine distance
    const sql = `
      SELECT ${selectCols},
             1 - (${column} <=> $1::vector) AS score
      FROM ${table}
      WHERE 1 - (${column} <=> $1::vector) > $2
      ORDER BY score DESC
      LIMIT $3
    `;
    const res = await pool.query(sql, [embJson, threshold, limit]);
    return res.rows;
  }

  // Fallback: column is JSONB, use pg_cosine_similarity()
  const sql = `
    SELECT ${selectCols},
           pg_cosine_similarity(${column}, $1::jsonb) AS score
    FROM ${table}
    WHERE pg_cosine_similarity(${column}, $1::jsonb) > $2
    ORDER BY score DESC
    LIMIT $3
  `;
  const res = await pool.query(sql, [embJson, threshold, limit]);
  return res.rows;
}
