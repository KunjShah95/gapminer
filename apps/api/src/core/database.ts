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
