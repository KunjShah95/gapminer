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

pool.on('error', (err) => {
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
  } catch (err: any) {
    console.error('❌ Database init failed:', err.message);
  }
}
