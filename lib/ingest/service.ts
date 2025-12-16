/**
 * Content ingestion service - orchestrates the ingestion pipeline
 */
import { db as prisma } from '@/lib/db';
import { logger } from '@/lib/logger';
import { queueManager, JobType } from '@/lib/queue';
import { TextConnector } from './connectors/text';
import { YouTubeConnector } from './connectors/youtube';
import { PDFConnector } from './connectors/pdf';
import { WebConnector } from './connectors/web';
import { WebSearchConnector } from './connectors/websearch';
import { chunkText, generateContentHash } from './chunker';
import type {
  SourceType,
  SourcePayload,
  ContentConnector,
  ProcessedContent,
} from './types';
import { IngestionStatus } from './types';

export interface CreateIngestionJobParams {
  workspaceId: string;
  userId: string;
  sourceType: SourceType;
  payload: SourcePayload;
}

export class IngestionService {
  private connectors: Map<SourceType, ContentConnector>;

  constructor() {
    this.connectors = new Map([
      ['text', new TextConnector()],
      ['youtube', new YouTubeConnector()],
      ['pdf', new PDFConnector()],
      ['web', new WebConnector()],
      ['websearch', new WebSearchConnector()],
    ]);
  }

  async createIngestionJob(params: CreateIngestionJobParams): Promise<string> {
    const { workspaceId, userId, sourceType, payload } = params;

    // Validate connector exists
    const connector = this.connectors.get(sourceType);
    if (!connector) {
      throw new Error(`Unsupported source type: ${sourceType}`);
    }

    // Validate payload
    const isValid = await connector.validate(payload);
    if (!isValid) {
      throw new Error('Invalid payload for source type');
    }

    // Create database record with pending status
    const contentSource = await prisma.contentSource.create({
      data: {
        workspaceId,
        userId,
        sourceType,
        status: IngestionStatus.PENDING,
        rawPayload: payload as Record<string, unknown>,
      },
    });

    // For text sources, process immediately (fast)
    // For other sources, queue for background processing
    if (sourceType === 'text') {
      await this.processIngestion(contentSource.id);
    } else {
      // Try to queue the job, but process synchronously if queue unavailable
      const job = await queueManager.addJob(JobType.INGEST_CONTENT, {
        ingestionId: contentSource.id,
      });

      if (!job) {
        // Queue not available, process synchronously
        logger.warn('Queue not available, processing ingestion synchronously');
        await this.processIngestion(contentSource.id);
      }
    }

    logger.info(`Ingestion job created: ${contentSource.id}`, {
      sourceType,
      workspaceId,
    });

    return contentSource.id;
  }

  async processIngestion(ingestionId: string): Promise<void> {
    const contentSource = await prisma.contentSource.findUnique({
      where: { id: ingestionId },
    });

    if (!contentSource) {
      throw new Error(`Content source not found: ${ingestionId}`);
    }

    try {
      // Update status to processing
      await prisma.contentSource.update({
        where: { id: ingestionId },
        data: { status: IngestionStatus.PROCESSING },
      });

      // Get connector and extract content
      const connector = this.connectors.get(
        contentSource.sourceType as SourceType
      );
      if (!connector) {
        throw new Error(`Unsupported source type: ${contentSource.sourceType}`);
      }

      const extracted = await connector.extract(
        contentSource.rawPayload as SourcePayload
      );

      // Chunk the text
      const chunks = chunkText(extracted.text, {
        sourceType: contentSource.sourceType as SourceType,
        metadata: {
          title: extracted.metadata.title,
          url: extracted.metadata.url,
          author: extracted.metadata.author,
          timestamp: extracted.metadata.timestamp,
        },
      });

      // Generate summary (first N words)
      const summary = this.generateSummary(extracted.text);

      // Generate content hash for deduplication
      const contentHash = generateContentHash(extracted.text);

      // Calculate size
      const sizeBytes = Buffer.byteLength(extracted.text, 'utf8');

      const processedContent: ProcessedContent = {
        chunks: chunks.map((chunk) => ({
          id: chunk.id,
          text: chunk.text,
          metadata: chunk.metadata,
          tokens: chunk.tokens,
        })),
        summary,
        wordCount: extracted.metadata.wordCount,
        citations: extracted.citations,
      };

      // Update with processed content
      await prisma.contentSource.update({
        where: { id: ingestionId },
        data: {
          status: IngestionStatus.COMPLETED,
          processedContent: processedContent as Record<string, unknown>,
          metadata: extracted.metadata as Record<string, unknown>,
          citations: extracted.citations as Record<string, unknown>[],
          contentHash,
          sizeBytes,
        },
      });

      logger.info(`Ingestion completed: ${ingestionId}`, {
        sourceType: contentSource.sourceType,
        wordCount: extracted.metadata.wordCount,
        chunks: chunks.length,
      });
    } catch (error) {
      logger.error(`Ingestion failed: ${ingestionId}`, error);

      await prisma.contentSource.update({
        where: { id: ingestionId },
        data: {
          status: IngestionStatus.FAILED,
          error: (error as Error).message,
        },
      });

      throw error;
    }
  }

  async getIngestionStatus(ingestionId: string): Promise<{
    status: string;
    error?: string;
    metadata?: Record<string, unknown>;
  }> {
    const contentSource = await prisma.contentSource.findUnique({
      where: { id: ingestionId },
      select: {
        status: true,
        error: true,
        metadata: true,
      },
    });

    if (!contentSource) {
      throw new Error(`Content source not found: ${ingestionId}`);
    }

    return {
      status: contentSource.status,
      error: contentSource.error || undefined,
      metadata: contentSource.metadata as Record<string, unknown> | undefined,
    };
  }

  async getProcessedContent(
    ingestionId: string
  ): Promise<ProcessedContent | null> {
    const contentSource = await prisma.contentSource.findUnique({
      where: { id: ingestionId },
      select: {
        processedContent: true,
        status: true,
      },
    });

    if (!contentSource) {
      throw new Error(`Content source not found: ${ingestionId}`);
    }

    if (contentSource.status !== IngestionStatus.COMPLETED) {
      return null;
    }

    return contentSource.processedContent as ProcessedContent;
  }

  async listContentSources(workspaceId: string, limit = 50, offset = 0) {
    const sources = await prisma.contentSource.findMany({
      where: { workspaceId },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
      select: {
        id: true,
        sourceType: true,
        status: true,
        metadata: true,
        sizeBytes: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    const total = await prisma.contentSource.count({
      where: { workspaceId },
    });

    return {
      sources,
      total,
      limit,
      offset,
    };
  }

  async deleteContentSource(ingestionId: string): Promise<void> {
    await prisma.contentSource.delete({
      where: { id: ingestionId },
    });

    logger.info(`Content source deleted: ${ingestionId}`);
  }

  private generateSummary(text: string, maxWords = 100): string {
    const words = text.split(/\s+/).slice(0, maxWords);
    let summary = words.join(' ');

    if (words.length === maxWords) {
      summary += '...';
    }

    return summary;
  }
}

export const ingestionService = new IngestionService();
