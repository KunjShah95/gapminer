import { PrismaClient } from '@prisma/client';
import pg from 'pg';
import { config } from './config.js';

const { Pool } = pg;

// Prisma Client for modern ORM duties
export const prisma = new PrismaClient();

// Legacy Pool for raw SQL (used in some existing routes)
const connectionString = config.DATABASE_URL.replace('postgresql+asyncpg://', 'postgresql://');

export const pool = new Pool({
  connectionString,
  max: 10,
  idleTimeoutMillis: 30_000,
  connectionTimeoutMillis: 5_000,
});

pool.on('error', (err: any) => {
  console.error('Unexpected PostgreSQL pool error:', err);
});

export const query = (text: string, params?: any[]) => pool.query(text, params);
export const getClient = () => pool.connect();

export async function initDb() {
  try {
    await prisma.$connect();
    console.log('✅ Prisma connected to database');
    
    // Logic to ensure tables exist if not using migrations
    // (Prisma handles this with `prisma db push` but we keep the log for consistency)
    let client: pg.PoolClient | undefined;
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

        CREATE TABLE IF NOT EXISTS notifications (
          id TEXT PRIMARY KEY,
          user_id TEXT NOT NULL REFERENCES users(id),
          title TEXT NOT NULL,
          message TEXT NOT NULL,
          type TEXT NOT NULL DEFAULT 'system',
          read BOOLEAN NOT NULL DEFAULT FALSE,
          link TEXT,
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

        CREATE TABLE IF NOT EXISTS job_applications (
          id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
          user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          company TEXT NOT NULL,
          role TEXT NOT NULL,
          status TEXT NOT NULL DEFAULT 'saved',
          salary INTEGER,
          location TEXT,
          job_url TEXT,
          notes TEXT,
          applied_date DATE,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );

        CREATE TABLE IF NOT EXISTS resume_versions (
          id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
          resume_id TEXT NOT NULL REFERENCES resumes(id) ON DELETE CASCADE,
          user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          content TEXT NOT NULL,
          change_summary TEXT,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );

        CREATE TABLE IF NOT EXISTS career_snapshots (
          id TEXT PRIMARY KEY,
          user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          analysis_id TEXT REFERENCES analyses(id) ON DELETE SET NULL,
          target_role TEXT,
          target_company TEXT,
          overall_score FLOAT,
          ats_score FLOAT,
          resume_strength_score FLOAT,
          skills JSONB NOT NULL DEFAULT '[]',
          matched_skills JSONB NOT NULL DEFAULT '[]',
          missing_skills JSONB NOT NULL DEFAULT '[]',
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );

        CREATE TABLE IF NOT EXISTS skill_evolution (
          id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
          user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          skill_name TEXT NOT NULL,
          status TEXT NOT NULL DEFAULT 'tracked',
          first_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          last_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          appearance_count INTEGER NOT NULL DEFAULT 1,
          was_missing_count INTEGER NOT NULL DEFAULT 0,
          was_matched_count INTEGER NOT NULL DEFAULT 0,
          UNIQUE(user_id, skill_name)
        );

        -- Developer Portal Tables
        CREATE TABLE IF NOT EXISTS api_keys (
          id TEXT PRIMARY KEY,
          user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          key_hash TEXT UNIQUE NOT NULL,
          key_prefix TEXT NOT NULL,
          name TEXT NOT NULL,
          permissions TEXT NOT NULL DEFAULT 'read',
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          last_used_at TIMESTAMPTZ,
          revoked_at TIMESTAMPTZ
        );
        CREATE INDEX IF NOT EXISTS idx_api_keys_user_id ON api_keys(user_id);
        CREATE INDEX IF NOT EXISTS idx_api_keys_key_hash ON api_keys(key_hash);

        CREATE TABLE IF NOT EXISTS api_key_usage (
          id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
          user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          api_key_id TEXT REFERENCES api_keys(id) ON DELETE SET NULL,
          endpoint TEXT NOT NULL,
          method TEXT NOT NULL,
          status_code INTEGER,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );
        CREATE INDEX IF NOT EXISTS idx_api_key_usage_user_id ON api_key_usage(user_id);
        CREATE INDEX IF NOT EXISTS idx_api_key_usage_created ON api_key_usage(created_at);

        -- Cover Letter v2 Tables
        CREATE TABLE IF NOT EXISTS cover_letter_templates (
          id TEXT PRIMARY KEY,
          user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          name TEXT NOT NULL,
          content TEXT NOT NULL,
          tone TEXT NOT NULL DEFAULT 'professional',
          target_role TEXT,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMPTZ
        );
        CREATE INDEX IF NOT EXISTS idx_cl_templates_user_id ON cover_letter_templates(user_id);

        CREATE TABLE IF NOT EXISTS cover_letter_variants (
          id TEXT PRIMARY KEY,
          template_id TEXT NOT NULL REFERENCES cover_letter_templates(id) ON DELETE CASCADE,
          user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          variant_name TEXT NOT NULL,
          content TEXT NOT NULL,
          tone TEXT NOT NULL,
          job_url TEXT,
          company_name TEXT,
          job_title TEXT,
          status TEXT NOT NULL DEFAULT 'draft',
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );
        CREATE INDEX IF NOT EXISTS idx_cl_variants_user_id ON cover_letter_variants(user_id);
        CREATE INDEX IF NOT EXISTS idx_cl_variants_template ON cover_letter_variants(template_id);
      `);

      await client.query(`
        ALTER TABLE users ADD COLUMN IF NOT EXISTS two_factor_enabled BOOLEAN NOT NULL DEFAULT FALSE;
        ALTER TABLE resumes ADD COLUMN IF NOT EXISTS parsing_status TEXT NOT NULL DEFAULT 'pending';
        ALTER TABLE resumes ADD COLUMN IF NOT EXISTS parsed_text TEXT;
        CREATE INDEX IF NOT EXISTS idx_resumes_parsing_status ON resumes(parsing_status);
        ALTER TABLE users ADD COLUMN IF NOT EXISTS two_factor_secret TEXT;
        ALTER TABLE users ADD COLUMN IF NOT EXISTS password_reset_token TEXT;
        ALTER TABLE users ADD COLUMN IF NOT EXISTS password_reset_expires TIMESTAMPTZ;
        ALTER TABLE users ADD COLUMN IF NOT EXISTS role TEXT NOT NULL DEFAULT 'USER';

        ALTER TABLE analyses ADD COLUMN IF NOT EXISTS gap_analysis JSONB;
        ALTER TABLE analyses ADD COLUMN IF NOT EXISTS normalized_skills JSONB;

        ALTER TABLE resumes ADD COLUMN IF NOT EXISTS embedding_json JSONB;
        ALTER TABLE job_descriptions ADD COLUMN IF NOT EXISTS embedding_json JSONB;
      `);

      await client.query(`
        CREATE INDEX IF NOT EXISTS idx_job_applications_user_id ON job_applications(user_id);
        CREATE INDEX IF NOT EXISTS idx_resume_versions_resume_id ON resume_versions(resume_id);
        CREATE INDEX IF NOT EXISTS idx_analyses_user_id ON analyses(user_id);
        CREATE INDEX IF NOT EXISTS idx_career_snapshots_user_id ON career_snapshots(user_id);
        CREATE INDEX IF NOT EXISTS idx_skill_evolution_user_id ON skill_evolution(user_id);
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
      console.log('✅ pg_cosine_similarity fallback function created');

      // Detect native pgvector availability and cache the result
      try {
        await client.query('CREATE EXTENSION IF NOT EXISTS vector');
        _hasPgVector = true;
        console.log('✅ Native pgvector extension available');
        await client.query(`
          ALTER TABLE resumes ADD COLUMN IF NOT EXISTS embedding vector(384);
          ALTER TABLE job_descriptions ADD COLUMN IF NOT EXISTS embedding vector(384);
        `);
      } catch {
        _hasPgVector = false;
        console.log('ℹ️  Native pgvector unavailable — using JSONB embedding_json + PL/pgSQL fallback');
      }

      console.log('✅ Database tables verified/created');
    } catch (err: any) {
      console.error('❌ Database schema init failed (raw tables):', err.message);
    } finally {
      client?.release?.();
    }
  } catch (err: any) {
    console.error('❌ Database init failed:', err.message);
  }
}

// ── Vector Query Infrastructure ──
let _hasPgVector: boolean | null = null;

/**
 * Check whether native pgvector is available.
 * Safe to call before initDb() — returns false if not yet detected.
 */
export function hasPgVector(): boolean {
  return _hasPgVector === true;
}

interface VectorQueryOptions {
  table: string;
  column: string;
  embedding: number[];
  select?: string[];
  limit?: number;
  threshold?: number;
}

/**
 * Run a cosine-similarity vector search against any table.
 * Automatically selects native pgvector operators or the PL/pgSQL fallback.
 */
export async function vectorQuery({
  table,
  column,
  embedding,
  select = ['id'],
  limit = 10,
  threshold = 0,
}: VectorQueryOptions): Promise<Array<{ id: string; score: number; [key: string]: any }>> {
  const selectCols = select.join(', ');
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
