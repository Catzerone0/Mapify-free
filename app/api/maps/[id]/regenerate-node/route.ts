/**
 * Regenerate a specific node and its subtree
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { auth } from '@/lib/auth';
import { AIMapEngine } from '@/lib/ai/engine';
import { ExpansionRequest, MapNodeData } from '@/lib/ai/types';
import { ApiError } from '@/lib/errors';
import { rateLimiter } from '@/lib/rate-limit';

const RegenerationSchema = z.object({
  nodeId: z.string().min(1, 'Node ID is required'),
  prompt: z.string().optional(),
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
    const rateLimitKey = `maps:regenerate:${clientIp}`;
    
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
    const validated = RegenerationSchema.parse(body);
    
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
      include: {
        rootNodes: true,
        workspace: {
          include: {
            members: {
              where: { userId: session.user.id! },
            },
          },
        },
      },
    });
    
    if (!mindMap) {
      throw new ApiError(403, 'Mind map not found or access denied');
    }
    
    // Find the target node
    let targetNode: MapNodeData | null = null;
    const findNode = (nodes: MapNodeData[]): boolean => {
      for (const node of nodes) {
        if (node.id === validated.nodeId) {
          targetNode = node;
          return true;
        }
        if (node.children && node.children.length > 0) {
          if (findNode(node.children)) return true;
        }
      }
      return false;
    };
    
    findNode(mindMap.rootNodes);
    
    if (!targetNode) {
      throw new ApiError(404, 'Target node not found');
    }
    
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
    
    // Create regeneration request (similar to expansion but regenerates the node itself)
    const regenerationRequest: ExpansionRequest = {
      nodeId: validated.nodeId,
      prompt: validated.prompt || `Regenerate this node: ${targetNode.title || targetNode.content}`,
      complexity: validated.complexity,
      provider: validated.provider,
      userId: session.user.id!,
    };
    
    // Start AI map engine
    const engine = new AIMapEngine();
    const result = await engine.regenerateNode(mindMapId, regenerationRequest);
    
    if (!result.success) {
      throw new ApiError(500, result.error || 'Regeneration failed');
    }
    
    // Update the mind map with the regenerated node
    const updateNodeInTree = (nodes: MapNodeData[]): MapNodeData[] => {
      return nodes.map((node) => {
        if (node.id === validated.nodeId) {
          return {
            ...node,
            ...result.data,
          };
        }
        if (node.children) {
          return {
            ...node,
            children: updateNodeInTree(node.children),
          };
        }
        return node;
      });
    };
    
    const updatedRootNodes = updateNodeInTree(mindMap.rootNodes);
    
    // Update the mind map in the database
    await db.mindMap.update({
      where: { id: mindMapId },
      data: {
        rootNodes: updatedRootNodes,
        metadata: {
          ...mindMap.metadata,
          updatedAt: new Date(),
        },
      },
    });
    
    // Return the regenerated node data
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
    
    console.error('Node regeneration error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}