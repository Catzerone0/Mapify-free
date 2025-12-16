/**
 * Example usage of the content ingestion pipeline
 * These examples show how to integrate ingestion with the LLM map engine
 */

import { ingestionService } from './service';
import type { SourceType, SourcePayload } from './types';

/**
 * Example 1: Ingest text and generate mind map
 */
export async function ingestTextExample(
  workspaceId: string,
  userId: string
): Promise<string> {
  const ingestionId = await ingestionService.createIngestionJob({
    workspaceId,
    userId,
    sourceType: 'text' as SourceType,
    payload: {
      text: 'Artificial intelligence is transforming industries...',
      title: 'AI Overview',
    } as SourcePayload,
  });

  // For text, processing is immediate
  const processedContent = await ingestionService.getProcessedContent(ingestionId);

  if (processedContent) {
    console.log('Chunks:', processedContent.chunks.length);
    console.log('Word count:', processedContent.wordCount);
  }

  return ingestionId;
}

/**
 * Example 2: Ingest YouTube video and poll for completion
 */
export async function ingestYouTubeExample(
  workspaceId: string,
  userId: string,
  videoUrl: string
): Promise<void> {
  const videoId = extractVideoId(videoUrl);

  const ingestionId = await ingestionService.createIngestionJob({
    workspaceId,
    userId,
    sourceType: 'youtube' as SourceType,
    payload: {
      url: videoUrl,
      videoId,
    } as SourcePayload,
  });

  // Poll for completion
  let status = await ingestionService.getIngestionStatus(ingestionId);

  while (status.status === 'pending' || status.status === 'processing') {
    await new Promise((resolve) => setTimeout(resolve, 2000));
    status = await ingestionService.getIngestionStatus(ingestionId);
  }

  if (status.status === 'completed') {
    const content = await ingestionService.getProcessedContent(ingestionId);
    console.log('Ingestion completed:', content?.summary);
  } else {
    console.error('Ingestion failed:', status.error);
  }
}

/**
 * Example 3: Ingest web page with error handling
 */
export async function ingestWebPageExample(
  workspaceId: string,
  userId: string,
  url: string
): Promise<string | null> {
  try {
    const ingestionId = await ingestionService.createIngestionJob({
      workspaceId,
      userId,
      sourceType: 'web' as SourceType,
      payload: {
        url,
      } as SourcePayload,
    });

    return ingestionId;
  } catch (error) {
    console.error('Failed to ingest web page:', error);
    return null;
  }
}

/**
 * Example 4: Use ingested content with LLM map engine
 */
export async function generateMindMapFromIngestion(
  ingestionId: string,
  userPrompt: string
): Promise<void> {
  // Get processed content
  const processedContent = await ingestionService.getProcessedContent(ingestionId);

  if (!processedContent) {
    throw new Error('Content not ready yet');
  }

  // Combine chunks for LLM context
  const contextText = processedContent.chunks
    .map((chunk) => chunk.text)
    .slice(0, 10) // Limit to first 10 chunks
    .join('\n\n');

  // Prepare citations
  const citations = processedContent.citations.map((cite) => ({
    title: cite.title,
    url: cite.url || '',
    excerpt: cite.excerpt || '',
  }));

  console.log('Context prepared for LLM:', {
    prompt: userPrompt,
    contextLength: contextText.length,
    chunks: processedContent.chunks.length,
    wordCount: processedContent.wordCount,
    citations: citations.length,
  });

  // Now you would pass this to the AI map engine:
  // const mindMap = await aiMapEngine.generate({
  //   prompt: userPrompt,
  //   context: contextText,
  //   citations,
  // });
}

/**
 * Example 5: Batch ingestion with web search
 */
export async function ingestWebSearchExample(
  workspaceId: string,
  userId: string,
  query: string
): Promise<string> {
  const ingestionId = await ingestionService.createIngestionJob({
    workspaceId,
    userId,
    sourceType: 'websearch' as SourceType,
    payload: {
      query,
      maxResults: 5,
    } as SourcePayload,
  });

  return ingestionId;
}

/**
 * Example 6: List and filter content sources
 */
export async function listRecentSourcesExample(
  workspaceId: string
): Promise<void> {
  const result = await ingestionService.listContentSources(
    workspaceId,
    20, // limit
    0 // offset
  );

  console.log(`Found ${result.total} content sources`);
  console.log('Recent sources:', result.sources);
}

// Helper function
function extractVideoId(url: string): string {
  const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
  return match ? match[1] : '';
}
