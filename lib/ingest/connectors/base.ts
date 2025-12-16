/**
 * Base connector interface for content ingestion
 */
import type {
  ContentConnector,
  ExtractedContent,
  SourcePayload,
} from '../types';

export abstract class BaseConnector implements ContentConnector {
  abstract extract(payload: SourcePayload): Promise<ExtractedContent>;
  abstract validate(payload: SourcePayload): Promise<boolean>;

  protected createExtractedContent(
    text: string,
    metadata: ExtractedContent['metadata'],
    citations: ExtractedContent['citations'] = []
  ): ExtractedContent {
    return {
      text,
      metadata: {
        ...metadata,
        wordCount: this.countWords(text),
      },
      citations,
    };
  }

  protected countWords(text: string): number {
    return text.trim().split(/\s+/).length;
  }

  protected async retryWithBackoff<T>(
    fn: () => Promise<T>,
    maxRetries = 3,
    initialDelay = 1000
  ): Promise<T> {
    let lastError: Error | undefined;

    for (let i = 0; i < maxRetries; i++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error as Error;
        if (i < maxRetries - 1) {
          const delay = initialDelay * Math.pow(2, i);
          await new Promise((resolve) => setTimeout(resolve, delay));
        }
      }
    }

    throw lastError;
  }
}
