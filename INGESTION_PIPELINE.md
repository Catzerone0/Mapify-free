# Content Ingestion Pipeline

A comprehensive content ingestion system for the MindMap application that supports multiple content sources and provides a unified pipeline for processing, chunking, and storing content for AI-powered mind map generation.

## Features

### ✅ MVP Features Implemented

1. **Text Input** - Direct text paste with normalization
2. **YouTube Transcripts** - Automatic transcript extraction with metadata
3. **PDF Upload** - Text extraction from PDF documents
4. **Web Page Scraping** - Content extraction with boilerplate removal
5. **Web Search** - Search result aggregation (SerpAPI, Tavily, Bing)

### 🔧 Architecture

```
┌─────────────────────────────────────────────────────────┐
│                     API Layer                           │
│  POST /api/ingest - Create ingestion job               │
│  GET  /api/ingest - List content sources               │
│  GET  /api/ingest/[id] - Get source details            │
│  GET  /api/ingest/[id]/status - Poll status            │
│  GET  /api/ingest/[id]/content - Get processed content │
│  DELETE /api/ingest/[id] - Delete source               │
└─────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────┐
│                  Ingestion Service                      │
│  - Job creation and orchestration                      │
│  - Connector selection and validation                  │
│  - Status tracking and error handling                  │
└─────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────┐
│                    Connectors                           │
│  TextConnector     - Plain text processing             │
│  YouTubeConnector  - Transcript fetching               │
│  PDFConnector      - PDF parsing                       │
│  WebConnector      - Web page extraction               │
│  WebSearchConnector - Search result aggregation        │
└─────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────┐
│                  Processing Pipeline                    │
│  1. Content extraction                                 │
│  2. Text normalization                                 │
│  3. Chunking with overlap                              │
│  4. Metadata enrichment                                │
│  5. Citation generation                                │
│  6. Hash generation (deduplication)                    │
└─────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────┐
│                Database (ContentSource)                 │
│  - Status tracking (pending/processing/completed)      │
│  - Raw payload storage                                 │
│  - Processed content with chunks                       │
│  - Metadata and citations                              │
│  - Content hash for deduplication                      │
└─────────────────────────────────────────────────────────┘
```

## API Usage

### 1. Create Ingestion Job

**Text Input:**
```bash
POST /api/ingest
Content-Type: application/json
Authorization: Bearer <token>

{
  "sourceType": "text",
  "workspaceId": "workspace_123",
  "payload": {
    "text": "Your content here...",
    "title": "Optional Title"
  }
}
```

**YouTube Video:**
```bash
POST /api/ingest
{
  "sourceType": "youtube",
  "workspaceId": "workspace_123",
  "payload": {
    "url": "https://www.youtube.com/watch?v=VIDEO_ID",
    "videoId": "VIDEO_ID"
  }
}
```

**PDF Upload:**
```bash
POST /api/ingest
{
  "sourceType": "pdf",
  "workspaceId": "workspace_123",
  "payload": {
    "filename": "document.pdf",
    "fileUrl": "https://example.com/document.pdf"
  }
}
```

**Web Page:**
```bash
POST /api/ingest
{
  "sourceType": "web",
  "workspaceId": "workspace_123",
  "payload": {
    "url": "https://example.com/article"
  }
}
```

**Web Search:**
```bash
POST /api/ingest
{
  "sourceType": "websearch",
  "workspaceId": "workspace_123",
  "payload": {
    "query": "artificial intelligence",
    "maxResults": 5
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "ingestionId": "ing_abc123",
    "status": "pending",
    "message": "Ingestion job created successfully"
  }
}
```

### 2. Check Status

```bash
GET /api/ingest/ing_abc123/status
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "status": "completed",
    "metadata": {
      "title": "Article Title",
      "url": "https://example.com/article",
      "wordCount": 1234,
      "timestamp": "2024-01-01T00:00:00Z"
    }
  }
}
```

### 3. Get Processed Content

```bash
GET /api/ingest/ing_abc123/content
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "chunks": [
      {
        "id": "chunk_1",
        "text": "First chunk of content...",
        "metadata": {
          "title": "Article Title",
          "url": "https://example.com",
          "chunkIndex": 0,
          "totalChunks": 5,
          "sourceType": "web"
        },
        "tokens": 250
      }
    ],
    "summary": "Brief summary of content...",
    "wordCount": 1234,
    "citations": [
      {
        "title": "Article Title",
        "url": "https://example.com",
        "excerpt": "Relevant excerpt..."
      }
    ]
  }
}
```

### 4. List Content Sources

```bash
GET /api/ingest?workspaceId=workspace_123&limit=20&offset=0
Authorization: Bearer <token>
```

### 5. Delete Content Source

```bash
DELETE /api/ingest/ing_abc123
Authorization: Bearer <token>
```

## Configuration

### Environment Variables

```bash
# Required for YouTube transcripts (none - uses public API)

# Optional: Web search providers (at least one required for websearch)
TAVILY_API_KEY=your_tavily_key
SERPAPI_API_KEY=your_serpapi_key
BING_SEARCH_API_KEY=your_bing_key

# Required for background job processing
REDIS_URL=redis://localhost:6379
```

### Content Size Limits

- **Text:** 1MB
- **PDF:** 10MB
- **Web:** 5MB
- **YouTube:** 2MB transcript
- **Web Search:** 5MB aggregated results

### Chunking Configuration

- **Max Chunk Size:** ~1000 tokens (configurable)
- **Overlap:** 200 characters (configurable)
- **Sentence-aware:** Splits at sentence boundaries when possible

## Background Workers

The ingestion pipeline uses BullMQ for background processing of slow tasks (PDF, YouTube, Web scraping, Web search).

**Start workers:**

```typescript
import { startIngestionWorker, startMindMapWorker } from '@/lib/workers/ingest-worker';

// Start workers (usually in a separate process)
const ingestionWorker = startIngestionWorker();
const mindMapWorker = startMindMapWorker();
```

**Worker configuration:**
- Concurrency: 3 jobs
- Rate limit: 10 jobs per 60 seconds
- Retry: 3 attempts with exponential backoff

## Database Schema

### ContentSource Model

```prisma
model ContentSource {
  id               String   @id @default(cuid())
  workspaceId      String
  userId           String
  sourceType       String   // "text" | "youtube" | "pdf" | "web" | "websearch"
  status           String   // "pending" | "processing" | "completed" | "failed"
  rawPayload       Json     // Original input data
  processedContent Json?    // Normalized chunks with metadata
  metadata         Json?    // Title, URL, timestamps, author, etc.
  error            String?  // Error message for failed ingestions
  embeddings       Json?    // Vector embeddings (optional)
  citations        Json?    // Source attribution
  contentHash      String?  // For deduplication
  sizeBytes        Int      @default(0)
  createdAt        DateTime @default(now())
  updatedAt        DateTime @updatedAt

  workspace Workspace @relation(...)
  user      User      @relation(...)

  @@index([workspaceId])
  @@index([userId])
  @@index([status])
  @@index([sourceType])
  @@index([contentHash])
}
```

## Integration with LLM Pipeline

The ingestion pipeline is designed to feed content to the LLM map engine:

```typescript
import { ingestionService } from '@/lib/ingest';

// Get processed content for mind map generation
const processedContent = await ingestionService.getProcessedContent(ingestionId);

if (processedContent) {
  // Use chunks and citations in LLM prompt
  const contextText = processedContent.chunks
    .map(chunk => chunk.text)
    .join('\n\n');

  // Generate mind map with AI engine
  const mindMap = await aiMapEngine.generate({
    prompt: userPrompt,
    context: contextText,
    citations: processedContent.citations,
  });
}
```

## Testing

Comprehensive test suites are provided for all components:

```bash
# Run all tests
npm test

# Test specific components
npm test lib/ingest/chunker.test.ts
npm test lib/ingest/validation.test.ts
npm test lib/ingest/connectors/text.test.ts
```

**Test coverage:**
- ✅ Chunking utilities (happy/error paths)
- ✅ Validation schemas (all source types)
- ✅ Text connector (extraction and normalization)
- ⏳ YouTube connector (requires mocking)
- ⏳ PDF connector (requires mocking)
- ⏳ Web connector (requires mocking)
- ⏳ Web search connector (requires mocking)

## Error Handling

The pipeline includes comprehensive error handling:

1. **Validation Errors** - Invalid payloads return 400 with details
2. **Size Limit Errors** - Content too large returns clear message
3. **Extraction Errors** - Failed extraction (e.g., no transcript) tracked in status
4. **Retry Logic** - Automatic retry with exponential backoff
5. **Status Tracking** - All errors stored in database for debugging

## Rate Limiting

API endpoints include rate limiting:
- **POST /api/ingest:** 10 requests per minute
- Prevents abuse and resource exhaustion

## Security

1. **Authentication Required** - All endpoints require valid session
2. **Workspace Access Control** - Users can only access their workspace content
3. **Input Validation** - All payloads validated with Zod schemas
4. **Content Sanitization** - Text normalized and cleaned

## Future Enhancements (Nice-to-have)

- 📧 Email import (RFC5322 parser)
- 📰 RSS feed ingestion
- 🖼️ Image OCR (Tesseract/Cloud Vision)
- 🎙️ Audio transcription (AssemblyAI/Whisper)
- 📁 Google Drive/Notion integration
- 🔍 Vector embeddings for semantic search
- 🔄 Real-time status via WebSocket
- 📊 Usage analytics and metrics
- 🎨 Content preview generation
- 🔗 Duplicate detection and merging

## Performance Considerations

1. **Text sources** process synchronously (fast)
2. **Other sources** queue for background processing
3. **Chunking** optimized for LLM token limits
4. **Caching** web search results (future)
5. **Deduplication** via content hash

## Troubleshooting

**Issue: "No search provider configured"**
- Set at least one of: `TAVILY_API_KEY`, `SERPAPI_API_KEY`, `BING_SEARCH_API_KEY`

**Issue: "No transcript available"**
- YouTube video may not have captions/subtitles
- Try a different video or use manual text input

**Issue: "Failed to extract readable content"**
- Web page may be behind login/paywall
- Try using direct text paste instead

**Issue: "Queue not available"**
- Redis not configured or not running
- Set `REDIS_URL` environment variable

## Support

For issues or questions:
- Check logs for detailed error messages
- Review API response error details
- Consult test files for usage examples
