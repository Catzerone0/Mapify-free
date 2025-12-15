/**
 * Summarize mind map API endpoint
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { auth } from '@/lib/auth';
import { AIMapEngine } from '@/lib/ai/engine';
import { SummarizationRequest } from '@/lib/ai/types';
import { ApiError } from '@/lib/errors';
import { rateLimiter } from '@/lib/rate-limit';

const SummarizeSchema = z.object({
  provider: z.enum(['openai', 'gemini', 'anthropic']).optional(),
});

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: mindMapId } = await params;
    
    // Apply rate limiting
    const clientIp = request.headers.get('x-forwarded-for') || 'unknown';
    const rateLimitKey = `maps:${mindMapId}:summarize:${clientIp}`;
    
    try {
      rateLimiter.check(rateLimitKey, { windowMs: 60000, maxRequests: 5 });
    } catch {
      throw new ApiError(429, 'Rate limit exceeded');
    }
    
    // Authenticate user
    const session = await auth();
    if (!session?.user?.id) {
      throw new ApiError(401, 'Unauthorized');
    }
    
    // Get mind map to validate access
    const mindMap = await db.mindMap.findUnique({
      where: { id: mindMapId },
      include: {
        workspace: {
          include: {
            members: {
              where: { userId: session.user.id },
            },
          },
        },
      },
    });
    
    if (!mindMap) {
      throw new ApiError(404, 'Mind map not found');
    }
    
    if (mindMap.workspace.members.length === 0) {
      throw new ApiError(403, 'Access denied');
    }
    
    // Parse and validate request body
    const body = await request.json();
    const validated = SummarizeSchema.parse(body);
    
    // Validate provider access
    const provider = validated.provider || 'openai';
    const userKey = await db.userProviderKey.findUnique({
      where: {
        userId_provider: {
          userId: session.user.id!,
          provider,
        },
      },
    });
    
    if (!userKey) {
      throw new ApiError(400, `No API key found for provider ${provider}`);
    }
    
    // Check if summary already exists and is recent (less than 1 hour old)
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    if (mindMap.summary && mindMap.updatedAt > oneHourAgo) {
      return NextResponse.json({
        success: true,
        summary: mindMap.summary,
        cached: true,
      });
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
      cached: false,
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