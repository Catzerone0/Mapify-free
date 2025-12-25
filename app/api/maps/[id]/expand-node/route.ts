/**
 * Expand an existing node with AI-generated children
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { getAuthUser } from '@/lib/middleware';
import { AIMapEngine } from '@/lib/ai/engine';
import { ExpansionRequest } from '@/lib/ai/types';
import { ApiError } from '@/lib/errors';
import { rateLimiter } from '@/lib/rate-limit';
import { logger } from '@/lib/logger';

const ExpansionSchema = z.object({
  nodeId: z.string().min(1, 'Node ID is required'),
  prompt: z.string().optional(),
  depth: z.number().min(1).max(5).optional(),
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
    const rateLimitKey = `maps:expand:${clientIp}`;
    
    try {
      rateLimiter.check(rateLimitKey, { windowMs: 60000, maxRequests: 5 });
    } catch {
      throw new ApiError(429, 'Rate limit exceeded');
    }
    
    // Authenticate user
    let userId: string;
    try {
      const user = await getAuthUser(request);
      userId = user.id;
    } catch {
      throw new ApiError(401, 'Unauthorized');
    }

    // Parse and validate request body
    const body = await request.json();
    const validated = ExpansionSchema.parse(body);
    
    // Validate access to the mind map
    const mindMap = await db.mindMap.findFirst({
      where: {
        id: mindMapId,
        workspace: {
          members: {
            some: {
              userId,
            },
          },
        },
      },
      include: {
        nodes: {
          include: {
            children: true,
            parent: true,
          },
        },
        workspace: {
          include: {
            members: {
              where: { userId },
            },
          },
        },
      },
    });
    
    if (!mindMap) {
      throw new ApiError(403, 'Mind map not found or access denied');
    }
    
    // Find the target node
    const targetNode = mindMap.nodes.find(node => node.id === validated.nodeId);
    
    if (!targetNode) {
      throw new ApiError(404, 'Target node not found');
    }
    
    // Validate provider access
    const provider = validated.provider || 'openai';
    const userKey = await db.userProviderKey.findFirst({
      where: {
        userId,
        provider,
      },
      orderBy: {
        isDefault: 'desc',
      },
    });
    
    if (!userKey) {
      throw new ApiError(400, `No API key found for provider ${provider}`);
    }
    
    // Create expansion request
    const expansionRequest: ExpansionRequest = {
      nodeId: validated.nodeId,
      prompt: validated.prompt,
      depth: validated.depth,
      complexity: validated.complexity,
      provider: validated.provider,
      userId,
    };
    
    // Start AI map engine
    const engine = new AIMapEngine();
    const result = await engine.expandNode(mindMapId, expansionRequest);
    
    if (!result.success) {
      throw new ApiError(500, result.error || 'Expansion failed');
    }
    
    // The AI engine already handles updating the database with new nodes
    // We just need to return the success response
    
    // Return the expanded node data
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
    
    logger.error('Node expansion error', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}