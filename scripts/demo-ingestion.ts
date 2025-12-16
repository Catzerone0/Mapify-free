/**
 * Demo script showing the full ingestion pipeline
 * This script demonstrates how to use the ingestion service
 *
 * Usage: npx tsx scripts/demo-ingestion.ts
 */

import { ingestionService } from '../lib/ingest/service';
import { SourceType } from '../lib/ingest/types';

async function demoTextIngestion(): Promise<void> {
  console.log('=== Text Ingestion Demo ===\n');

  const sampleText = `
    Artificial Intelligence (AI) is transforming how we work and live.
    Machine learning algorithms can now process vast amounts of data
    to identify patterns and make predictions. Deep learning, a subset
    of machine learning, uses neural networks to achieve remarkable
    results in image recognition, natural language processing, and more.
  `;

  console.log('Creating ingestion job for text content...');

  const ingestionId = await ingestionService.createIngestionJob({
    workspaceId: 'demo-workspace',
    userId: 'demo-user',
    sourceType: SourceType.TEXT,
    payload: {
      text: sampleText,
      title: 'AI Overview',
    },
  });

  console.log(`Ingestion ID: ${ingestionId}`);

  // For text, processing is immediate
  const status = await ingestionService.getIngestionStatus(ingestionId);
  console.log(`Status: ${status.status}`);

  if (status.status === 'completed') {
    const content = await ingestionService.getProcessedContent(ingestionId);

    if (content) {
      console.log('\nProcessed Content:');
      console.log(`- Total chunks: ${content.chunks.length}`);
      console.log(`- Word count: ${content.wordCount}`);
      console.log(`- Summary: ${content.summary}`);

      console.log('\nFirst chunk:');
      console.log(content.chunks[0].text.substring(0, 200) + '...');

      console.log('\nChunk metadata:');
      console.log(JSON.stringify(content.chunks[0].metadata, null, 2));
    }
  }

  console.log('\n=== Demo Complete ===\n');
}

async function demoWebIngestion(): Promise<void> {
  console.log('=== Web Page Ingestion Demo ===\n');

  console.log('Note: This demo requires a working database connection.');
  console.log('To test web ingestion, use the API endpoint instead.\n');

  console.log('Example API call:');
  console.log(`
POST /api/ingest
{
  "sourceType": "web",
  "workspaceId": "workspace_id",
  "payload": {
    "url": "https://example.com/article"
  }
}
  `);

  console.log('\n=== Demo Complete ===\n');
}

async function demoYouTubeIngestion(): Promise<void> {
  console.log('=== YouTube Ingestion Demo ===\n');

  console.log('Note: This demo requires a working database connection.');
  console.log('To test YouTube ingestion, use the API endpoint instead.\n');

  console.log('Example API call:');
  console.log(`
POST /api/ingest
{
  "sourceType": "youtube",
  "workspaceId": "workspace_id",
  "payload": {
    "url": "https://www.youtube.com/watch?v=VIDEO_ID",
    "videoId": "VIDEO_ID"
  }
}
  `);

  console.log('\n=== Demo Complete ===\n');
}

async function main(): Promise<void> {
  const demoType = process.argv[2] || 'text';

  switch (demoType) {
    case 'text':
      await demoTextIngestion();
      break;
    case 'web':
      await demoWebIngestion();
      break;
    case 'youtube':
      await demoYouTubeIngestion();
      break;
    default:
      console.log('Unknown demo type. Use: text, web, or youtube');
      break;
  }
}

// Only run if executed directly (not imported)
if (require.main === module) {
  main()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error('Demo failed:', error);
      process.exit(1);
    });
}

export { demoTextIngestion, demoWebIngestion, demoYouTubeIngestion };
