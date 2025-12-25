/**
 * Background worker for processing content ingestion jobs
 */
import { Worker } from 'bullmq';
import { env } from '@/lib/env';
import { logger } from '@/lib/logger';
import { ingestionService } from '@/lib/ingest/service';
import { JobType } from '@/lib/queue';

export function startIngestionWorker(): Worker | null {
  if (!env.REDIS_URL) {
    logger.warn('Redis not configured, ingestion worker disabled');
    return null;
  }

  const worker = new Worker(
    JobType.INGEST_CONTENT,
    async (job) => {
      const { ingestionId } = job.data as { ingestionId: string };

      logger.info(`Processing ingestion job: ${ingestionId}`, {
        jobId: job.id,
      });

      try {
        await ingestionService.processIngestion(ingestionId);
        logger.info(`Ingestion job completed: ${ingestionId}`, {
          jobId: job.id,
        });
      } catch (error) {
        logger.error(`Ingestion job failed: ${ingestionId}`, {
          jobId: job.id,
          error,
        });
        throw error;
      }
    },
    {
      connection: {
        url: env.REDIS_URL,
      },
      concurrency: 3, // Process up to 3 jobs concurrently
      limiter: {
        max: 10, // Max 10 jobs
        duration: 60000, // Per 60 seconds
      },
    }
  );

  worker.on('completed', (job) => {
    logger.info(`Worker completed job: ${job.id}`);
  });

  worker.on('failed', (job, error) => {
    logger.error(`Worker failed job: ${job?.id}`, { error });
  });

  worker.on('error', (error) => {
    logger.error('Worker error', { error });
  });

  logger.info('Ingestion worker started');

  return worker;
}

// Also support processing PROCESS_MINDMAP jobs for backward compatibility
export function startMindMapWorker(): Worker | null {
  if (!env.REDIS_URL) {
    return null;
  }

  const worker = new Worker(
    JobType.PROCESS_MINDMAP,
    async (job) => {
      const data = job.data as { ingestionId?: string };

      if (data.ingestionId) {
        logger.info(`Processing ingestion via PROCESS_MINDMAP: ${data.ingestionId}`, {
          jobId: job.id,
        });

        try {
          await ingestionService.processIngestion(data.ingestionId);
          logger.info(`Ingestion completed: ${data.ingestionId}`, {
            jobId: job.id,
          });
        } catch (error) {
          logger.error(`Ingestion failed: ${data.ingestionId}`, {
            jobId: job.id,
            error,
          });
          throw error;
        }
      }
    },
    {
      connection: {
        url: env.REDIS_URL,
      },
      concurrency: 3,
    }
  );

  logger.info('MindMap worker started (with ingestion support)');

  return worker;
}
