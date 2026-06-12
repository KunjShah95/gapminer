/**
 * Resume parsing queue using BullMQ + Redis.
 * 
 * After uploading a resume file, the endpoint enqueues a job.
 * The worker picks it up, parses the document, runs skill extraction,
 * and updates the resume record with parsed data + status.
 * 
 * Falls back gracefully if Redis is unavailable (runs inline).
 */

import { Queue, Worker, Job } from 'bullmq';
import { Redis } from 'ioredis';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import { parseDocument } from './documentParser.js';
import { query } from '../core/database.js';
import { extractSkills } from './transformerModels.js';

let connection: Redis | null = null;
let isRedisAvailable = false;

async function initRedis() {
  try {
    connection = new Redis(process.env.REDIS_URL || 'redis://localhost:6379/0', {
      maxRetriesPerRequest: null,
      lazyConnect: true,
      retryStrategy(times) {
        // Retry up to 3 times with backoff, then give up
        if (times > 3) return null;
        return Math.min(times * 200, 2000);
      },
    });
    await connection.connect();
    isRedisAvailable = true;
    console.log('✅ Redis connected for resume parsing queue');
  } catch (e: any) {
    console.warn('⚠️ Redis not available — resume parsing will run inline:', e.message);
    connection = null;
  }
}

// Initialize Redis connection immediately
await initRedis();

// ─── Queue ──────────────────────────────────────────────────────
export const resumeQueue = connection
  ? new Queue('resume-parsing', {
      connection,
      defaultJobOptions: {
        attempts: 3,
        backoff: { type: 'exponential', delay: 2000 },
        removeOnComplete: 50,
        removeOnFail: 100,
      },
    })
  : null;

/**
 * Helper to parse a resume document inline (when Redis is unavailable).
 * Reads the file, extracts text, then runs skill extraction.
 */
export async function parseResumeInline(resumeId: string, filePath: string, mimetype: string): Promise<void> {
  const absolutePath = path.resolve(filePath);
  
  try {
    // Mark as parsing
    await query(
      "UPDATE resumes SET parsing_status = 'parsing' WHERE id = $1",
      [resumeId]
    );

    if (!fs.existsSync(absolutePath)) {
      throw new Error(`Resume file not found: ${absolutePath}`);
    }

    const buffer = fs.readFileSync(absolutePath);
    const resumeText = await parseDocument(buffer, mimetype);

    // Run skill extraction from the parsed text
    let extractedSkills: string[] = [];
    try {
      extractedSkills = await extractSkills(resumeText);
    } catch (skillErr: any) {
      console.warn(`Skill extraction failed for resume ${resumeId}:`, skillErr.message);
    }

    // Build parsed_data structure
    const parsedData = {
      rawText: resumeText,
      skills: extractedSkills,
      parsedAt: new Date().toISOString(),
    };

    // Update the resume record
    await query(
      `UPDATE resumes 
       SET parsing_status = 'completed', 
           parsed_text = $1,
           parsed_data = $2
       WHERE id = $3`,
      [resumeText, JSON.stringify(parsedData), resumeId]
    );

    console.log(`✅ Resume ${resumeId} parsed inline — ${extractedSkills.length} skills found`);
  } catch (err: any) {
    console.error(`❌ Resume ${resumeId} inline parsing failed:`, err.message);
    await query(
      "UPDATE resumes SET parsing_status = 'failed' WHERE id = $1",
      [resumeId]
    );
    throw err;
  }
}

/**
 * Enqueue a resume parsing job, or run inline if Redis is unavailable.
 */
export async function enqueueResumeParsing(
  resumeId: string,
  filePath: string,
  mimetype: string,
): Promise<void> {
  if (resumeQueue && isRedisAvailable) {
    await resumeQueue.add('parse-resume', {
      resumeId,
      filePath,
      mimetype,
    });
    console.log(`📤 Resume ${resumeId} enqueued for parsing`);
  } else {
    console.log(`📄 Resume ${resumeId} — Redis unavailable, parsing inline`);
    await parseResumeInline(resumeId, filePath, mimetype);
  }
}

// ─── Worker ─────────────────────────────────────────────────────
if (connection && isRedisAvailable) {
  const worker = new Worker(
    'resume-parsing',
    async (job: Job) => {
      const { resumeId, filePath, mimetype } = job.data;
      await parseResumeInline(resumeId, filePath, mimetype);
      return { status: 'completed', resumeId };
    },
    {
      connection,
      concurrency: 3, // Parse up to 3 resumes concurrently
      limiter: {
        max: 10,
        duration: 1000,
      },
    }
  );

  worker.on('completed', (job: Job) => {
    console.log(`✅ Job ${job.id} (resume ${job.data.resumeId}) completed`);
  });

  worker.on('failed', (job: Job | undefined, err: Error) => {
    if (job) {
      console.error(`❌ Job ${job.id} (resume ${job.data.resumeId}) failed:`, err.message);
      // Update resume status to failed
      query(
        "UPDATE resumes SET parsing_status = 'failed' WHERE id = $1",
        [job.data.resumeId]
      ).catch(e => console.error('Failed to update resume status on job fail:', e));
    }
  });

  worker.on('error', (err: Error) => {
    console.error('⚠️ Resume queue worker error:', err.message);
  });

  console.log('✅ Resume parsing worker initialized (concurrency: 3)');
}

console.log('✅ Batch queue initialized');
