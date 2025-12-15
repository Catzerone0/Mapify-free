/**
 * Save mind map changes (PATCH) or get mind map data (GET)
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { auth } from '@/lib/auth';
import { MindMapData, MapNodeData } from '@/lib/ai/types';
import { ApiError } from '@/lib/errors';

const MindMapUpdateSchema = z.object({
  mindMap: z.object({
    id: z.string(),
    title: z.string(),
    description: z.string().optional(),
    summary: z.string().optional(),
    prompt: z.string().optional(),
    provider: z.string().optional(),
    complexity: z.enum(['simple', 'moderate', 'complex']),
    rootNodes: z.array(z.any()),
    metadata: z.object({
      totalNodes: z.number(),
      maxDepth: z.number(),
      createdAt: z.date().optional(),
      updatedAt: z.date().optional(),
    }),
  }),
});

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: mindMapId } = await params;
    
    // Authenticate user
    const session = await auth();
    if (!session?.user?.id) {
      throw new ApiError(401, 'Unauthorized');
    }
    
    // Get mind map with user access validation
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
        nodes: {
          include: {
            citations: true,
            children: {
              include: {
                citations: true,
                children: {
                  include: {
                    citations: true,
                  },
                },
              },
            },
          },
        },
      },
    });
    
    if (!mindMap) {
      throw new ApiError(404, 'Mind map not found');
    }
    
    // Convert database format to API format
    const convertNodeToApiFormat = (node: unknown, parentId: string | null = null): MapNodeData => {
      const dbNode = node as Record<string, unknown>;
      return {
        id: String(dbNode.id),
        title: dbNode.title ? String(dbNode.title) : undefined,
        content: String(dbNode.content),
        parentId,
        level: Number(dbNode.level),
        order: Number(dbNode.order),
        visual: {
          x: Number(dbNode.x),
          y: Number(dbNode.y),
          width: Number(dbNode.width),
          height: Number(dbNode.height),
          color: dbNode.color ? String(dbNode.color) : undefined,
          shape: String(dbNode.shape) as 'rectangle' | 'circle' | 'diamond' | 'hexagon',
          isCollapsed: Boolean(dbNode.isCollapsed),
        },
        citations: Array.isArray(dbNode.citations) ? dbNode.citations.map((citation: unknown) => {
          const c = citation as Record<string, unknown>;
          return {
            id: String(c.id),
            title: String(c.title),
            url: c.url ? String(c.url) : undefined,
            summary: c.summary ? String(c.summary) : undefined,
            author: c.author ? String(c.author) : undefined,
          };
        }) : [],
        children: Array.isArray(dbNode.children) ? dbNode.children.map((child: unknown) => convertNodeToApiFormat(child, String(dbNode.id))) : [],
      };
    };
    
    const rootNodes = mindMap.nodes
      .filter(node => !node.parentId)
      .map(node => convertNodeToApiFormat(node));
    
    const mindMapData: MindMapData = {
      id: mindMap.id,
      title: mindMap.title,
      description: mindMap.description || undefined,
      summary: mindMap.summary || undefined,
      prompt: mindMap.prompt || undefined,
      provider: mindMap.provider || undefined,
      complexity: mindMap.complexity as 'simple' | 'moderate' | 'complex',
      rootNodes,
      metadata: {
        totalNodes: mindMap.metadata.totalNodes,
        maxDepth: mindMap.metadata.maxDepth,
        createdAt: mindMap.metadata.createdAt || undefined,
        updatedAt: mindMap.metadata.updatedAt || undefined,
      },
    };
    
    return NextResponse.json({
      success: true,
      data: mindMapData,
    });
    
  } catch (error) {
    if (error instanceof ApiError) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: error.statusCode }
      );
    }
    
    console.error('Get mind map error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: mindMapId } = await params;
    
    // Apply rate limiting for updates
    const clientIp = request.headers.get('x-forwarded-for') || 'unknown';
    // In a real implementation, you'd have a proper rate limiter for saves
    
    // Authenticate user
    const session = await auth();
    if (!session?.user?.id) {
      throw new ApiError(401, 'Unauthorized');
    }
    
    // Parse and validate request body
    const body = await request.json();
    const validated = MindMapUpdateSchema.parse(body);
    
    // Validate access to the mind map
    const existingMindMap = await db.mindMap.findFirst({
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
        nodes: true,
      },
    });
    
    if (!existingMindMap) {
      throw new ApiError(403, 'Mind map not found or access denied');
    }
    
    // Update mind map metadata
    await db.mindMap.update({
      where: { id: mindMapId },
      data: {
        title: validated.mindMap.title,
        description: validated.mindMap.description,
        summary: validated.mindMap.summary,
        prompt: validated.mindMap.prompt,
        provider: validated.mindMap.provider,
        complexity: validated.mindMap.complexity,
        metadata: {
          ...existingMindMap.metadata,
          totalNodes: validated.mindMap.metadata.totalNodes,
          maxDepth: validated.mindMap.metadata.maxDepth,
          updatedAt: new Date(),
        },
      },
    });
    
    // Process node changes
    const processNodeUpdates = async (nodes: MapNodeData[], parentId: string | null = null) => {
      for (const [index, node] of nodes.entries()) {
        if (node.id) {
          // Update existing node
          await db.mapNode.update({
            where: { id: node.id },
            data: {
              title: node.title,
              content: node.content,
              parentId,
              x: node.visual.x,
              y: node.visual.y,
              width: node.visual.width,
              height: node.visual.height,
              color: node.visual.color,
              shape: node.visual.shape,
              level: node.level,
              order: index,
              isCollapsed: node.visual.isCollapsed,
              updatedAt: new Date(),
            },
          });
          
          // Update citations
          await db.nodeCitation.deleteMany({
            where: { nodeId: node.id },
          });
          
          for (const citation of node.citations) {
            await db.nodeCitation.create({
              data: {
                nodeId: node.id,
                title: citation.title,
                url: citation.url,
                summary: citation.summary,
                author: citation.author,
              },
            });
          }
        } else {
          // Create new node
          const newNode = await db.mapNode.create({
            data: {
              mindMapId,
              title: node.title,
              content: node.content,
              parentId,
              x: node.visual.x,
              y: node.visual.y,
              width: node.visual.width,
              height: node.visual.height,
              color: node.visual.color,
              shape: node.visual.shape,
              level: node.level,
              order: index,
              isCollapsed: node.visual.isCollapsed,
            },
          });
          
          // Create citations
          for (const citation of node.citations) {
            await db.nodeCitation.create({
              data: {
                nodeId: newNode.id,
                title: citation.title,
                url: citation.url,
                summary: citation.summary,
                author: citation.author,
              },
            });
          }
          
          node.id = newNode.id; // Update the ID in the object
        }
        
        // Process children recursively
        if (node.children && node.children.length > 0) {
          await processNodeUpdates(node.children, node.id!);
        }
      }
    };
    
    await processNodeUpdates(validated.mindMap.rootNodes);
    
    return NextResponse.json({
      success: true,
      message: 'Mind map updated successfully',
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
    
    console.error('Update mind map error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}