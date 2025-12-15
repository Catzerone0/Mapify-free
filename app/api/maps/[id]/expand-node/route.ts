/**
 * Expand mind map node API endpoint
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { auth } from '@/lib/auth';
import { AIMapEngine } from '@/lib/ai/engine';
import { ExpansionRequest } from '@/lib/ai/types';
import { ApiError } from '@/lib/errors';
import { rateLimiter, rateLimitConfigs } from '@/lib/rate-limit';

const ExpandSchema = z.object({
  nodeId: z.string().min(1, 'Node ID is required'),
  prompt: z.string().optional(),
  depth: z.number().int().min(1).max(5).optional(),
  complexity: z.enum(['simple', 'moderate', 'complex']).optional(),
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
    const rateLimitKey = `maps:${mindMapId}:expand-node:${clientIp}`;
    
    try {
      rateLimiter.check(rateLimitKey, { windowMs: 60000, maxRequests: 10 });
    } catch (error) {
      throw new ApiError(429, 'Rate limit exceeded');
    }
    
    // Authenticate user
    const session = await auth();
    if (!session?.user) {
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
      throw new ApiError('Mind map not found', 404);
    }
    
    if (mindMap.workspace.members.length === 0) {
      throw new ApiError('Access denied', 403);
    }
    
    // Parse and validate request body
    const body = await request.json();
    const validated = ExpandSchema.parse(body);
    
    // Validate that the node belongs to this mind map
    const node = await db.mapNode.findUnique({
      where: { id: validated.nodeId },
    });
    
    if (!node || node.mindMapId !== mindMapId) {
      throw new ApiError('Node not found in this mind map', 404);
    }
    
    // Validate provider access
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
    
    // Create expansion request
    const expansionRequest: ExpansionRequest = {
      nodeId: validated.nodeId,
      prompt: validated.prompt,
      depth: validated.depth,
      complexity: validated.complexity,
      provider: validated.provider,
      userId: session.user.id,
    };
    
    // Start AI map engine
    const engine = new AIMapEngine();
    const result = await engine.expandNode(expansionRequest);
    
    if (!result.success) {
      throw new ApiError(result.error || 'Node expansion failed', 500);
    }
    
    // Return the expanded node
    return NextResponse.json({
      success: true,
      data: result.data,
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
    
    console.error('Node expansion error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}