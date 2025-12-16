# Integrating Content Ingestion with Mind Map Generation

This document explains how to use the content ingestion pipeline with the AI-powered mind map engine to create mind maps from various content sources.

## Quick Start

### 1. Ingest Content

```typescript
import { ingestionService } from '@/lib/ingest';

// Create an ingestion job
const ingestionId = await ingestionService.createIngestionJob({
  workspaceId: 'workspace_123',
  userId: 'user_456',
  sourceType: 'youtube', // or 'text', 'pdf', 'web', 'websearch'
  payload: {
    url: 'https://www.youtube.com/watch?v=VIDEO_ID',
    videoId: 'VIDEO_ID',
  },
});
```

### 2. Wait for Processing

```typescript
// Poll for completion
let status = await ingestionService.getIngestionStatus(ingestionId);

while (status.status !== 'completed' && status.status !== 'failed') {
  await new Promise(resolve => setTimeout(resolve, 2000));
  status = await ingestionService.getIngestionStatus(ingestionId);
}
```

### 3. Generate Mind Map

```typescript
import { aiMapEngine } from '@/lib/ai/engine';

// Get processed content
const processedContent = await ingestionService.getProcessedContent(ingestionId);

if (processedContent) {
  // Prepare context from chunks
  const context = processedContent.chunks
    .map(chunk => chunk.text)
    .slice(0, 10) // Limit to avoid token limits
    .join('\n\n');

  // Generate mind map
  const mindMapData = await aiMapEngine.generate({
    prompt: 'Analyze the key concepts from this content',
    context,
    provider: 'openai',
    complexity: 'moderate',
  });

  // Citations are available from processedContent.citations
}
```

## API Integration

### Frontend Example (React)

```typescript
'use client';

import { useState } from 'react';

export function IngestAndGenerate() {
  const [ingestionId, setIngestionId] = useState<string | null>(null);
  const [status, setStatus] = useState<string>('idle');

  const handleIngest = async (url: string) => {
    setStatus('ingesting');

    // Step 1: Create ingestion job
    const response = await fetch('/api/ingest', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${getToken()}`,
      },
      body: JSON.stringify({
        sourceType: 'web',
        workspaceId: getCurrentWorkspaceId(),
        payload: { url },
      }),
    });

    const { data } = await response.json();
    setIngestionId(data.ingestionId);

    // Step 2: Poll for completion
    await pollStatus(data.ingestionId);
  };

  const pollStatus = async (id: string) => {
    const interval = setInterval(async () => {
      const response = await fetch(`/api/ingest/${id}/status`, {
        headers: {
          'Authorization': `Bearer ${getToken()}`,
        },
      });

      const { data } = await response.json();

      if (data.status === 'completed') {
        clearInterval(interval);
        setStatus('completed');
        await generateMindMap(id);
      } else if (data.status === 'failed') {
        clearInterval(interval);
        setStatus('failed');
      }
    }, 2000);
  };

  const generateMindMap = async (id: string) => {
    setStatus('generating');

    // Get processed content
    const contentResponse = await fetch(`/api/ingest/${id}/content`, {
      headers: {
        'Authorization': `Bearer ${getToken()}`,
      },
    });

    const { data: processedContent } = await contentResponse.json();

    // Generate mind map
    const mapResponse = await fetch('/api/maps/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${getToken()}`,
      },
      body: JSON.stringify({
        workspaceId: getCurrentWorkspaceId(),
        prompt: 'Create a mind map from this content',
        sourceIds: [id], // Pass ingestion IDs for context
        complexity: 'moderate',
        provider: 'openai',
      }),
    });

    const { data: mindMap } = await mapResponse.json();
    setStatus('complete');

    // Navigate to mind map editor
    window.location.href = `/mindmap/editor?id=${mindMap.id}`;
  };

  return (
    <div>
      <input
        type="url"
        placeholder="Enter URL..."
        onBlur={(e) => handleIngest(e.target.value)}
      />
      <p>Status: {status}</p>
    </div>
  );
}
```

## Batch Processing Multiple Sources

```typescript
async function createMindMapFromMultipleSources(
  workspaceId: string,
  userId: string,
  sources: Array<{ type: string; payload: unknown }>
): Promise<string> {
  // Ingest all sources
  const ingestionIds = await Promise.all(
    sources.map(source =>
      ingestionService.createIngestionJob({
        workspaceId,
        userId,
        sourceType: source.type,
        payload: source.payload,
      })
    )
  );

  // Wait for all to complete
  await Promise.all(
    ingestionIds.map(id => waitForCompletion(id))
  );

  // Gather all processed content
  const allContent = await Promise.all(
    ingestionIds.map(id =>
      ingestionService.getProcessedContent(id)
    )
  );

  // Combine chunks from all sources
  const combinedContext = allContent
    .filter(content => content !== null)
    .flatMap(content => content!.chunks)
    .map(chunk => chunk.text)
    .join('\n\n');

  // Combine citations
  const allCitations = allContent
    .filter(content => content !== null)
    .flatMap(content => content!.citations);

  // Generate unified mind map
  const mindMapData = await aiMapEngine.generate({
    prompt: 'Create a comprehensive mind map synthesizing these sources',
    context: combinedContext,
    provider: 'openai',
    complexity: 'complex',
  });

  return mindMapData.id;
}
```

## Context Window Management

Large content may exceed LLM token limits. Here's how to handle it:

```typescript
import { estimateTokens } from '@/lib/ingest/chunker';

async function prepareContextForLLM(
  ingestionId: string,
  maxTokens = 8000
): Promise<{ context: string; citations: Citation[] }> {
  const processedContent = await ingestionService.getProcessedContent(ingestionId);

  if (!processedContent) {
    throw new Error('Content not ready');
  }

  let totalTokens = 0;
  const selectedChunks = [];

  // Select chunks until we reach token limit
  for (const chunk of processedContent.chunks) {
    const chunkTokens = chunk.tokens || estimateTokens(chunk.text);

    if (totalTokens + chunkTokens > maxTokens) {
      break;
    }

    selectedChunks.push(chunk);
    totalTokens += chunkTokens;
  }

  return {
    context: selectedChunks.map(c => c.text).join('\n\n'),
    citations: processedContent.citations,
  };
}
```

## Caching Strategy

For frequently accessed content, implement caching:

```typescript
class CachedIngestionService {
  private cache = new Map<string, ProcessedContent>();

  async getProcessedContent(ingestionId: string): Promise<ProcessedContent | null> {
    // Check cache first
    if (this.cache.has(ingestionId)) {
      return this.cache.get(ingestionId)!;
    }

    // Fetch from database
    const content = await ingestionService.getProcessedContent(ingestionId);

    if (content) {
      this.cache.set(ingestionId, content);
    }

    return content;
  }

  clearCache(ingestionId?: string): void {
    if (ingestionId) {
      this.cache.delete(ingestionId);
    } else {
      this.cache.clear();
    }
  }
}
```

## Error Handling

```typescript
async function robustIngestionAndGeneration(
  workspaceId: string,
  userId: string,
  url: string
): Promise<string | null> {
  try {
    // Attempt ingestion
    const ingestionId = await ingestionService.createIngestionJob({
      workspaceId,
      userId,
      sourceType: 'web',
      payload: { url },
    });

    // Wait for completion with timeout
    const status = await waitForCompletionWithTimeout(ingestionId, 60000);

    if (status.status === 'failed') {
      console.error('Ingestion failed:', status.error);

      // Fallback: prompt user to paste text manually
      return null;
    }

    // Get content
    const content = await ingestionService.getProcessedContent(ingestionId);

    if (!content) {
      throw new Error('No content available');
    }

    // Generate mind map
    const mindMapData = await aiMapEngine.generate({
      prompt: 'Analyze this content',
      context: content.chunks.map(c => c.text).join('\n\n'),
      provider: 'openai',
      complexity: 'moderate',
    });

    return mindMapData.id;
  } catch (error) {
    console.error('Full pipeline failed:', error);
    // Implement fallback or user notification
    return null;
  }
}

async function waitForCompletionWithTimeout(
  ingestionId: string,
  timeoutMs: number
): Promise<{ status: string; error?: string }> {
  const startTime = Date.now();

  while (Date.now() - startTime < timeoutMs) {
    const status = await ingestionService.getIngestionStatus(ingestionId);

    if (status.status === 'completed' || status.status === 'failed') {
      return status;
    }

    await new Promise(resolve => setTimeout(resolve, 2000));
  }

  throw new Error('Ingestion timeout');
}
```

## Best Practices

1. **Always poll status** - Don't assume instant completion for non-text sources
2. **Handle failures gracefully** - Provide fallback options (manual paste)
3. **Respect token limits** - Chunk large content appropriately
4. **Cache processed content** - Avoid re-processing same sources
5. **Combine citations** - Include source attribution in mind maps
6. **Validate before processing** - Use validation schemas to catch errors early
7. **Monitor queue health** - Check Redis/BullMQ status in production
8. **Set appropriate timeouts** - Different sources have different processing times
9. **Implement retry logic** - Network issues may cause temporary failures
10. **Track usage** - Monitor ingestion volume for rate limiting

## Performance Tips

- **Text sources**: Process immediately (synchronous)
- **YouTube**: ~5-30 seconds depending on video length
- **PDF**: ~10-60 seconds depending on size
- **Web**: ~5-20 seconds depending on page complexity
- **WebSearch**: ~10-30 seconds depending on number of results

Use background workers (BullMQ) for optimal performance and user experience.

## Testing Integration

```typescript
describe('Ingestion → Mind Map Flow', () => {
  it('should create mind map from ingested web content', async () => {
    // Create ingestion job
    const ingestionId = await ingestionService.createIngestionJob({
      workspaceId: testWorkspaceId,
      userId: testUserId,
      sourceType: 'text',
      payload: {
        text: 'AI is transforming industries...',
        title: 'AI Overview',
      },
    });

    // Get processed content
    const content = await ingestionService.getProcessedContent(ingestionId);

    expect(content).toBeDefined();
    expect(content?.chunks.length).toBeGreaterThan(0);

    // Generate mind map
    const mindMapData = await aiMapEngine.generate({
      prompt: 'Create mind map',
      context: content!.chunks.map(c => c.text).join('\n\n'),
      provider: 'openai',
      complexity: 'simple',
    });

    expect(mindMapData.nodes.length).toBeGreaterThan(0);
  });
});
```

## Next Steps

See `INGESTION_PIPELINE.md` for detailed API documentation and `lib/ingest/examples.ts` for more usage patterns.
