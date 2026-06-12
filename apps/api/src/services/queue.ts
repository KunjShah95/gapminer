import { Queue } from 'bullmq';
import { Redis } from 'ioredis';

let connection: Redis | null = null;
let isRedisAvailable = false;

async function initRedis() {
  try {
    connection = new Redis(process.env.REDIS_URL || 'redis://localhost:6379/0', {
      maxRetriesPerRequest: null,
      lazyConnect: true,
      retryStrategy(times) {
        if (times > 3) return null;
        return Math.min(times * 200, 2000);
      },
    });
    await connection.connect();
    isRedisAvailable = true;
    console.log('✅ Redis connected for email queue');
  } catch (e: any) {
    console.warn('⚠️ Redis not available for email queue:', e.message);
    connection = null;
  }
}

await initRedis();

export const emailQueue = connection
  ? new Queue('email', {
      connection,
      defaultJobOptions: {
        attempts: 3,
        backoff: { type: 'exponential', delay: 2000 },
        removeOnComplete: 50,
        removeOnFail: 100,
      },
    })
  : null;

export { connection, isRedisAvailable };
