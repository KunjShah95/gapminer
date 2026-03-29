import { Queue, Worker, Job } from 'bullmq';
import { Redis } from 'ioredis';
import { parseDocument } from './documentParser.js';
import { runGapminerAnalysis } from '../ai/agent.js';
import { prisma } from '../core/database.js';

let connection: Redis | null = null;
let isRedisAvailable = false;

async function initRedis() {
  try {
    connection = new Redis(process.env.REDIS_URL || 'redis://localhost:6379/0', {
      maxRetriesPerRequest: null,
      lazyConnect: true,
    });
    await connection.connect();
    isRedisAvailable = true;
    console.log('✅ Redis connected for queue');
  } catch (e) {
    console.warn('⚠️ Redis not available, queue features disabled');
    connection = null;
  }
}

await initRedis();

export const resumeBatchQueue = connection ? new Queue('resume-batch', { connection }) : null;

if (connection && isRedisAvailable) {
  const resumeWorker = new Worker('resume-batch', async (job: Job) => {
    const { resumeId, filePath, mimetype, jobDescriptionText } = job.data;
    
    try {
      const fs = await import('fs');
      const path = await import('path');
      const absolutePath = path.resolve(filePath);
      
      if (!fs.existsSync(absolutePath)) {
        throw new Error(`Resume file not found: ${absolutePath}`);
      }
      
      const buffer = fs.readFileSync(absolutePath);
      const resumeText = await parseDocument(buffer, mimetype);
      const analysisStream = await runGapminerAnalysis(resumeText, jobDescriptionText || "");
      
      let finalOutput: any = {};
      for await (const chunk of analysisStream) {
        if (chunk.event === "on_chain_end") {
          finalOutput = chunk.data.output;
        }
      }
      
      await prisma.candidate.update({
        where: { id: resumeId },
        data: {
          resumeText,
          parsedData: finalOutput.resumeData,
          skillsFound: finalOutput.normalizedSkills,
          updatedAt: new Date(),
        }
      });

      console.log(`Successfully processed resume: ${resumeId}`);
      return { status: 'completed', resumeId };
    } catch (error: any) {
      console.error(`Error processing resume batch job ${job.id}:`, error);
      throw error;
    }
  }, { connection });

  resumeWorker.on('completed', (job: Job) => {
    console.log(`Job ${job.id} completed!`);
  });

  resumeWorker.on('failed', (job: Job | undefined, err: Error) => {
    console.error(`Job ${job?.id} failed:`, err);
  });
}

console.log('✅ Batch queue initialized');
