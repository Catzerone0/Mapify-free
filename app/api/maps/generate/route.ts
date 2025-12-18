/**
 * Main mind map generation API endpoint with streaming support
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { auth } from '@/lib/auth';
import { AIMapEngine } from '@/lib/ai/engine';
import { IngestionService } from '@/lib/ingest/service';
import {
  GenerationRequest
} from '@/lib/ai/types';
import { ApiError } from '@/lib/errors';
import { rateLimiter } from '@/lib/rate-limit';
import { SourceType } from '@/lib/ingest/types';

const GenerationSchema = z.object({
  prompt: z.string().optional(),
  youtubeUrl: z.string().optional(),
  webUrl: z.string().optional(),
  complexity: z.enum(['simple', 'moderate', 'complex']).optional(),
  provider: z.enum(['openai', 'gemini', 'anthropic']).optional(),
  workspaceId: z.string().min(1, 'Workspace ID is required'),
  contentType: z.enum(['text', 'youtube', 'pdf', 'web', 'file']).optional(),
  existingMapId: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    // Apply rate limiting
    const clientIp = request.headers.get('x-forwarded-for') || 'unknown';
    const rateLimitKey = `maps:generate:${clientIp}`;

    try {
      rateLimiter.check(rateLimitKey, { windowMs: 60000, maxRequests: 3 });
    } catch {
      throw new ApiError(429, 'Rate limit exceeded');
    }

    // Authenticate user
    const session = await auth();
    if (!session?.user?.id) {
      throw new ApiError(401, 'Unauthorized');
    }

    const userId = session.user.id;

    // Parse FormData or JSON
    const contentType = request.headers.get('content-type');
    let body: Record<string, unknown> = {};
    let pdfFile: File | null = null;

    if (contentType?.includes('multipart/form-data')) {
      const formData = await request.formData();
      body = Object.fromEntries(formData);
      pdfFile = formData.get('pdfFile') as File | null;
    } else {
      body = await request.json();
    }

    const validated = GenerationSchema.parse(body);

    // Validate workspace access
    const workspace = await db.workspace.findFirst({
      where: {
        id: validated.workspaceId,
        members: {
          some: {
            userId,
          },
        },
      },
    });

    if (!workspace) {
      throw new ApiError(403, 'Workspace not found or access denied');
    }

    // Validate provider access (user must have API key for the provider)
    const provider = validated.provider || 'openai';
    const userKey = await db.userProviderKey.findUnique({
      where: {
        userId_provider: {
          userId,
          provider,
        },
      },
    });

    if (!userKey) {
      throw new ApiError(400, `No API key found for provider ${provider}. Please configure your API keys in settings.`);
    }

    // Set up streaming response
    const encoder = new TextEncoder();
    let mapId: string | null = null;

    const stream = new ReadableStream({
      async start(controller) {
        try {
          const sendEvent = (type: string, data: Record<string, unknown>) => {
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify({ type, ...data })}\n\n`)
            );
          };

          sendEvent('start', {
            message: 'Initializing generation...',
          });

          // Determine content source
          let ingestionId: string | null = null;
          let prompt = validated.prompt || '';

          if (validated.contentType === 'text') {
            if (!prompt) {
              throw new Error('Prompt is required for text input');
            }
          } else if (validated.contentType === 'youtube') {
            if (!validated.youtubeUrl) {
              throw new Error('YouTube URL is required');
            }
            // Ingest YouTube content
            sendEvent('processing', {
              message: 'Extracting YouTube transcript...',
            });

            const ingestionService = new IngestionService();
            ingestionId = await ingestionService.createIngestionJob({
              workspaceId: validated.workspaceId,
              userId,
              sourceType: 'youtube' as SourceType,
              payload: {
                url: validated.youtubeUrl,
                videoId: extractYouTubeId(validated.youtubeUrl),
              },
            });

            sendEvent('processing', {
              message: 'YouTube transcript extracted, processing...',
            });

            // Wait for ingestion to complete
            const contentSource = await waitForIngestionComplete(ingestionId);
            if (!contentSource || contentSource.status === 'failed') {
              throw new Error(contentSource?.error || 'Failed to extract YouTube content');
            }

            // Use processed content as prompt
            const content = contentSource.processedContent as Record<string, unknown>;
            if (content && typeof content.summary === 'string') {
              prompt = content.summary;
            }
          } else if (validated.contentType === 'web') {
            if (!validated.webUrl) {
              throw new Error('URL is required');
            }
            // Ingest web content
            sendEvent('processing', {
              message: 'Fetching webpage content...',
            });

            const ingestionService = new IngestionService();
            ingestionId = await ingestionService.createIngestionJob({
              workspaceId: validated.workspaceId,
              userId,
              sourceType: 'web' as SourceType,
              payload: {
                url: validated.webUrl,
              },
            });

            sendEvent('processing', {
              message: 'Webpage content extracted, processing...',
            });

            // Wait for ingestion to complete
            const contentSource = await waitForIngestionComplete(ingestionId);
            if (!contentSource || contentSource.status === 'failed') {
              throw new Error(contentSource?.error || 'Failed to extract webpage content');
            }

            // Use processed content as prompt
            const content = contentSource.processedContent as Record<string, unknown>;
            if (content && typeof content.summary === 'string') {
              prompt = content.summary;
            }
          } else if (validated.contentType === 'pdf' && pdfFile) {
            sendEvent('processing', {
              message: 'Processing PDF file...',
            });

            const ingestionService = new IngestionService();
            const buffer = await pdfFile.arrayBuffer();
            ingestionId = await ingestionService.createIngestionJob({
              workspaceId: validated.workspaceId,
              userId,
              sourceType: 'pdf' as SourceType,
              payload: {
                filename: pdfFile.name,
                fileBuffer: Buffer.from(buffer),
              },
            });

            sendEvent('processing', {
              message: 'PDF extracted, processing...',
            });

            // Wait for ingestion to complete
            const contentSource = await waitForIngestionComplete(ingestionId);
            if (!contentSource || contentSource.status === 'failed') {
              throw new Error(contentSource?.error || 'Failed to extract PDF content');
            }

            // Use processed content as prompt
            const content = contentSource.processedContent as Record<string, unknown>;
            if (content && typeof content.summary === 'string') {
              prompt = content.summary;
            }
          }

          if (!prompt) {
            throw new Error('No content to generate mind map from');
          }

          sendEvent('processing', {
            message: 'Sending to LLM for generation...',
            progress: 40,
          });

          // Create generation request
          const generationRequest: GenerationRequest = {
            prompt,
            complexity: validated.complexity,
            provider: validated.provider,
            userId,
            workspaceId: validated.workspaceId,
            existingMapId: validated.existingMapId,
          };

          // Start AI map engine
          const engine = new AIMapEngine();
          const result = await engine.generateMindMap(generationRequest);

          if (!result.success) {
            throw new Error(result.error || 'Generation failed');
          }

          // Get the generated mind map ID
          const mindMaps = await db.mindMap.findMany({
            where: {
              workspaceId: validated.workspaceId,
            },
            orderBy: {
              createdAt: 'desc',
            },
            take: 1,
          });

          if (mindMaps.length > 0) {
            mapId = mindMaps[0].id;
          }

          sendEvent('streaming', {
            message: 'Building mind map structure...',
            progress: 70,
            nodeCount: result.data?.metadata?.totalNodes || 0,
          });

          // Send node creation events for streaming effect
          if (result.data?.rootNodes) {
            let nodeCount = 0;
            const walkNodes = (nodes: typeof result.data.rootNodes): void => {
              for (const node of nodes) {
                nodeCount++;
                sendEvent('node', {
                  nodeId: node.id,
                  title: node.title,
                  index: nodeCount,
                });
                if (node.children && node.children.length > 0) {
                  walkNodes(node.children);
                }
              }
            };
            walkNodes(result.data.rootNodes);
          }

          sendEvent('map', {
            message: 'Finalizing mind map...',
            mapId,
            progress: 95,
          });

          sendEvent('complete', {
            message: 'Mind map generation complete!',
            mapId,
            title: result.data?.title,
            nodeCount: result.data?.metadata?.totalNodes,
            tokensUsed: result.tokensUsed,
          });

          controller.close();
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({
                type: 'error',
                error: errorMessage,
              })}\n\n`
            )
          );
          controller.close();
        }
      },
    });

    return new NextResponse(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  } catch (error) {
    if (error instanceof ApiError) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: error.statusCode }
      );
    }

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid request data',
          details: error.errors,
        },
        { status: 400 }
      );
    }

    console.error('Mind map generation error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Extract YouTube video ID from URL
 */
function extractYouTubeId(url: string): string {
  const patterns = [
    /(?:https?:\/\/)?(?:www\.)?youtube\.com\/watch\?v=([^&]+)/,
    /(?:https?:\/\/)?(?:www\.)?youtu\.be\/([^?]+)/,
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) {
      return match[1];
    }
  }

  return '';
}

/**
 * Wait for ingestion to complete with timeout
 */
async function waitForIngestionComplete(ingestionId: string, maxWaitMs = 60000) {
  const startTime = Date.now();
  const pollInterval = 1000; // 1 second

  while (Date.now() - startTime < maxWaitMs) {
    const contentSource = await db.contentSource.findUnique({
      where: { id: ingestionId },
    });

    if (!contentSource) {
      return null;
    }

    if (contentSource.status === 'completed' || contentSource.status === 'failed') {
      return contentSource;
    }

    // Wait before polling again
    await new Promise((resolve) => setTimeout(resolve, pollInterval));
  }

  // Timeout
  throw new Error('Content ingestion timed out');
}
