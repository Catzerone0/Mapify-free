import { NextRequest } from 'next/server';
import { db as prisma } from '@/lib/db';
import { apiResponse, ApiError } from '@/lib/api-response';
import bcrypt from 'bcrypt';

// GET /api/shared/[token] - Access a shared mind map
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;
    const { searchParams } = new URL(req.url);
    const password = searchParams.get('password');

    // Find the share link
    const shareLink = await prisma.shareLink.findUnique({
      where: {
        token,
      },
      include: {
        mindMap: {
          include: {
            nodes: {
              include: {
                citations: true,
                attachments: true,
              },
            },
          },
        },
      },
    });

    if (!shareLink) {
      throw new ApiError('Share link not found', 404);
    }

    // Check if link has expired
    if (shareLink.expiresAt && shareLink.expiresAt < new Date()) {
      throw new ApiError('Share link has expired', 403);
    }

    // Verify password if required
    if (shareLink.password) {
      if (!password) {
        return apiResponse(
          { requiresPassword: true },
          'Password required',
          401
        );
      }

      const isValidPassword = await bcrypt.compare(password, shareLink.password);
      if (!isValidPassword) {
        throw new ApiError('Invalid password', 403);
      }
    }

    // Build the mind map data structure
    interface SharedNode {
      id: string;
      title: string | null;
      content: string;
      parentId: string | null;
      order: number;
      x: number;
      y: number;
      width: number;
      height: number;
      color: string | null;
      shape: string;
      isCollapsed: boolean;
      citations: unknown[];
      attachments: unknown[];
      children: SharedNode[];
    }

    const buildNodeTree = (nodes: typeof shareLink.mindMap.nodes, parentId: string | null = null): SharedNode[] => {
      return nodes
        .filter((node) => node.parentId === parentId)
        .sort((a, b) => a.order - b.order)
        .map((node) => ({
          id: node.id,
          title: node.title,
          content: node.content,
          visual: {
            x: node.x,
            y: node.y,
            width: node.width,
            height: node.height,
            color: node.color,
            shape: node.shape,
            isCollapsed: node.isCollapsed,
          },
          citations: node.citations,
          attachments: node.attachments,
          children: buildNodeTree(nodes, node.id),
        }));
    };

    const rootNodes = buildNodeTree(shareLink.mindMap.nodes);

    return apiResponse({
      mindMap: {
        id: shareLink.mindMap.id,
        title: shareLink.mindMap.title,
        description: shareLink.mindMap.description,
        summary: shareLink.mindMap.summary,
        rootNodes,
      },
      access: {
        role: shareLink.role,
        canEdit: shareLink.role === 'editor' || shareLink.role === 'owner',
        canView: true,
      },
    });
  } catch (error) {
    if (error instanceof ApiError) {
      return apiResponse(null, error.message, error.statusCode);
    }
    console.error('Error accessing shared map:', error);
    return apiResponse(null, 'Failed to access shared map', 500);
  }
}

// PATCH /api/shared/[token] - Update a shared mind map (if user has editor role)
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;
    const body = await req.json();
    const { password, nodeUpdates } = body;

    // Find the share link
    const shareLink = await prisma.shareLink.findUnique({
      where: {
        token,
      },
    });

    if (!shareLink) {
      throw new ApiError('Share link not found', 404);
    }

    // Check if link has expired
    if (shareLink.expiresAt && shareLink.expiresAt < new Date()) {
      throw new ApiError('Share link has expired', 403);
    }

    // Verify password if required
    if (shareLink.password) {
      if (!password) {
        throw new ApiError('Password required', 401);
      }

      const isValidPassword = await bcrypt.compare(password, shareLink.password);
      if (!isValidPassword) {
        throw new ApiError('Invalid password', 403);
      }
    }

    // Check if user has edit permissions
    if (shareLink.role !== 'editor' && shareLink.role !== 'owner') {
      throw new ApiError('Insufficient permissions', 403);
    }

    // Update nodes
    if (nodeUpdates && Array.isArray(nodeUpdates)) {
      for (const update of nodeUpdates) {
        const { nodeId, ...data } = update;
        await prisma.mapNode.update({
          where: { id: nodeId },
          data,
        });
      }
    }

    return apiResponse({ success: true });
  } catch (error) {
    if (error instanceof ApiError) {
      return apiResponse(null, error.message, error.statusCode);
    }
    console.error('Error updating shared map:', error);
    return apiResponse(null, 'Failed to update shared map', 500);
  }
}
