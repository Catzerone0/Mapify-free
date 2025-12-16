import { Queue } from "bullmq";
import { env } from "@/env";
import { logger } from "./logger";

// Job types
export enum JobType {
  SEND_EMAIL = "send-email",
  PROCESS_MINDMAP = "process-mindmap",
  EXPORT_DATA = "export-data",
  CLEANUP_SESSIONS = "cleanup-sessions",
  INGEST_CONTENT = "ingest-content",
}

interface EmailJob {
  to: string;
  subject: string;
  html: string;
}

interface MindMapJob {
  mindMapId?: string;
  workspaceId?: string;
  ingestionId?: string;
}

interface ExportJob {
  mindMapId: string;
  format: "pdf" | "json" | "markdown";
}

interface IngestionJob {
  ingestionId: string;
}

type JobData = EmailJob | MindMapJob | ExportJob | IngestionJob;

class QueueManager {
  private queues: Map<JobType, Queue> = new Map();
  private initialized = false;

  async initialize() {
    if (this.initialized) return;

    // Only initialize if Redis is available
    if (!env.REDIS_URL) {
      logger.warn("Redis not configured, job queue disabled");
      return;
    }

    try {
      // Initialize queues for each job type
      for (const jobType of Object.values(JobType)) {
        const queue = new Queue(jobType, {
          connection: {
            url: env.REDIS_URL,
          },
        });

        this.queues.set(jobType as JobType, queue);
        logger.info(`Queue initialized: ${jobType}`);
      }

      this.initialized = true;
    } catch (error) {
      logger.error("Failed to initialize job queues", error);
    }
  }

  async addJob<T extends JobData>(jobType: JobType, data: T, options?: Record<string, unknown>) {
    if (!this.initialized) {
      await this.initialize();
    }

    const queue = this.queues.get(jobType);
    if (!queue) {
      logger.warn(`Queue not available for job type: ${jobType}`);
      return null;
    }

    try {
      const job = await queue.add(jobType, data, {
        attempts: 3,
        backoff: {
          type: "exponential",
          delay: 2000,
        },
        ...options,
      });

      logger.debug(`Job added to queue: ${jobType}`, {
        jobId: job.id,
      });

      return job;
    } catch (error) {
      logger.error(`Failed to add job to queue: ${jobType}`, error);
      return null;
    }
  }

  getQueue(jobType: JobType) {
    return this.queues.get(jobType);
  }

  async close() {
    for (const queue of this.queues.values()) {
      await queue.close();
    }
    this.queues.clear();
    this.initialized = false;
  }
}

export const queueManager = new QueueManager();

// Worker registration would go here
// Example:
/*
const sendEmailWorker = new Worker(JobType.SEND_EMAIL, async (job) => {
  const { to, subject, html } = job.data;
  // Send email logic
}, {
  connection: {
    url: env.REDIS_URL!,
  },
});
*/
