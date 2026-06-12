import { Worker, Job } from 'bullmq';
import { connection, isRedisAvailable } from './queue.js';
import { onAnalysisComplete, onWeeklyDigest, onMilestoneReached } from './emailTriggers.js';
import { generateWeeklyCheckin } from './coachEmails.js';

if (connection && isRedisAvailable) {
  const worker = new Worker(
    'email',
    async (job: Job) => {
      const { type, data } = job.data;

      switch (type) {
        case 'analysis-complete':
          await onAnalysisComplete(data.userId, data.analysisId);
          break;
        case 'weekly-digest':
          await onWeeklyDigest(data.userId);
          break;
        case 'milestone-reached':
          await onMilestoneReached(data.userId, data.milestoneId, data.roadmapId);
          break;
        case 'weekly-coaching':
          await generateWeeklyCheckin(data.userId);
          break;
        default:
          console.warn(`[emailWorker] Unknown job type: ${type}`);
      }

      return { status: 'completed', type };
    },
    {
      connection,
      concurrency: 5,
      limiter: {
        max: 20,
        duration: 1000,
      },
    },
  );

  worker.on('completed', (job: Job) => {
    console.log(`✅ Email job ${job.id} (${job.data.type}) completed`);
  });

  worker.on('failed', (job: Job | undefined, err: Error) => {
    if (job) {
      console.error(`❌ Email job ${job.id} (${job.data?.type}) failed:`, err.message);
    }
  });

  worker.on('error', (err: Error) => {
    console.error('⚠️ Email queue worker error:', err.message);
  });

  console.log('✅ Email worker initialized (concurrency: 5)');
}
