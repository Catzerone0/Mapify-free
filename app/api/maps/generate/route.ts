/**
 * Main mind map generation API endpoint
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { auth } from '@/lib/auth';
import { AIMapEngine } from '@/lib/ai/engine';
import { 
  GenerationRequest
} from '@/lib/ai/types';
import { ApiError } from '@/lib/errors';
import { rateLimiter, rateLimitConfigs } from '@/lib/rate-limit';

const GenerationSchema = z.object({
  prompt: z.string().min(1, 'Prompt is required').max(2000, 'Prompt too long'),
  sources: z.array(z.string()).optional(),
  complexity: z.enum(['simple', 'moderate', 'complex']).optional(),
  provider: z.enum(['openai', 'gemini', 'anthropic']).optional(),
  workspaceId: z.string().min(1, 'Workspace ID is required'),
  existingMapId: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    // Apply rate limiting
    const clientIp = request.headers.get('x-forwarded-for') || 'unknown';
    const rateLimitKey = `maps:generate:${clientIp}`;
    
    try {
      rateLimiter.check(rateLimitKey, { windowMs: 60000, maxRequests: 3 });
    } catch (error) {
      throw new ApiError(429, 'Rate limit exceeded');
    }
    
    // Authenticate user
    const session = await auth();
    if (!session?.user) {
      throw new ApiError('Unauthorized', 401);
    }
    
    // Parse and validate request body
    const body = await request.json();
    const validated = GenerationSchema.parse(body);
    
    // Validate workspace access
    const workspace = await db.workspace.findFirst({
      where: {
        id: validated.workspaceId,
        members: {
          some: {
            userId: session.user.id,
          },
        },
      },
    });
    
    if (!workspace) {
      throw new ApiError('Workspace not found or access denied', 403);
    }
    
    // Validate provider access (user must have API key for the provider)
    const provider = validated.provider || 'openai';
    const userKey = await db.userProviderKey.findUnique({
      where: {
        userId_provider: {
          userId: session.user.id,
          provider,
        },
      },
    });
    
    if (!userKey) {
      throw new ApiError(`No API key found for provider ${provider}`, 400);
    }
    
    // Create generation request
    const generationRequest: GenerationRequest = {
      prompt: validated.prompt,
      sources: validated.sources,
      complexity: validated.complexity,
      provider: validated.provider,
      userId: session.user.id,
      workspaceId: validated.workspaceId,
      existingMapId: validated.existingMapId,
    };
    
    // Start AI map engine
    const engine = new AIMapEngine();
    const result = await engine.generateMindMap(generationRequest);
    
    if (!result.success) {
      throw new ApiError(result.error || 'Generation failed', 500);
    }
    
    // Return the generated mind map
    return NextResponse.json({
      success: true,
      data: {
        id: result.data!.id,
        title: result.data!.title,
        description: result.data!.description,
        summary: result.data!.summary,
        complexity: result.data!.complexity,
        metadata: result.data!.metadata,
      },
      tokensUsed: result.tokensUsed,
      provider: result.provider,
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