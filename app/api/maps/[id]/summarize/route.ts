/**
 * Summarize an existing mind map
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { auth } from '@/lib/auth';
import { AIMapEngine } from '@/lib/ai/engine';
import { SummarizationRequest } from '@/lib/ai/types';
import { ApiError } from '@/lib/errors';
import { rateLimiter } from '@/lib/rate-limit';

const SummarizationSchema = z.object({
  mindMapId: z.string().min(1, 'Mind map ID is required'),
  provider: z.enum(['openai', 'gemini', 'anthropic']).optional(),
});

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: mindMapIdFromParams } = await params;
    
    // Apply rate limiting
    const clientIp = request.headers.get('x-forwarded-for') || 'unknown';
    const rateLimitKey = `maps:summarize:${clientIp}`;
    
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
    
    // Parse and validate request body
    const body = await request.json();
    const validated = SummarizationSchema.parse(body);
    
    // Use mind map ID from params or request body
    const mindMapId = mindMapIdFromParams || validated.mindMapId;
    
    // Validate access to the mind map
    const mindMap = await db.mindMap.findFirst({
      where: {
        id: mindMapId,
        workspace: {
          members: {
            some: {
              userId: session.user.id!,
            },
          },
        },
      },
    });
    
    if (!mindMap) {
      throw new ApiError(403, 'Mind map not found or access denied');
    }
    
    // Validate provider access
    const provider = validated.provider || 'openai';
    const userKey = await db.userProviderKey.findFirst({
      where: {
        userId: session.user.id!,
        provider,
      },
      orderBy: {
        isDefault: 'desc',
      },
    });
    
    if (!userKey) {
      throw new ApiError(400, `No API key found for provider ${provider}`);
    }
    
    // Create summarization request
    const summarizationRequest: SummarizationRequest = {
      mindMapId,
      provider: validated.provider,
      userId: session.user.id!,
    };
    
    // Start AI map engine
    const engine = new AIMapEngine();
    const result = await engine.summarizeMindMap(summarizationRequest);
    
    if (!result.success) {
      throw new ApiError(500, result.error || 'Summarization failed');
    }
    
    // Return the summary
    return NextResponse.json({
      success: true,
      summary: result.summary,
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
    
    console.error('Mind map summarization error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}