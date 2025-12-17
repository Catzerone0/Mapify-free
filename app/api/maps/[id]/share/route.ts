import { NextRequest } from 'next/server';
import { db as prisma } from '@/lib/db';
import { getAuthUser } from '@/lib/middleware';
import { apiResponse, ApiError } from '@/lib/api-response';
import { z } from 'zod';
import bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';

const createShareLinkSchema = z.object({
  role: z.enum(['owner', 'editor', 'viewer']),
  password: z.string().optional(),
  expiresAt: z.string().datetime().optional(),
});

// POST /api/maps/[id]/share - Create a shareable link
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthUser(req);
    const { id: mindMapId } = await params;

    // Verify user has access to this mind map
    const mindMap = await prisma.mindMap.findFirst({
      where: {
        id: mindMapId,
        workspace: {
          members: {
            some: {
              userId: user.id,
            },
          },
        },
      },
      include: {
        workspace: {
          include: {
            members: {
              where: {
                userId: user.id,
              },
            },
          },
        },
      },
    });

    if (!mindMap) {
      throw new ApiError(404, 'Mind map not found');
    }

    // Check if user is owner (only owners can create share links)
    const membership = mindMap.workspace.members[0];
    if (membership.role !== 'owner') {
      throw new ApiError(403, 'Only workspace owners can create share links');
    }

    const body = await req.json();
    const { role, password, expiresAt } = createShareLinkSchema.parse(body);

    // Generate unique token
    const token = uuidv4().replace(/-/g, '');

    // Hash password if provided
    const hashedPassword = password ? await bcrypt.hash(password, 10) : null;

    const shareLink = await prisma.shareLink.create({
      data: {
        mindMapId,
        token,
        role,
        password: hashedPassword,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
        createdBy: user.id,
      },
    });

    return apiResponse({
      id: shareLink.id,
      token: shareLink.token,
      role: shareLink.role,
      expiresAt: shareLink.expiresAt,
      hasPassword: !!shareLink.password,
      url: `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/shared/${shareLink.token}`,
    });
  } catch (error) {
    if (error instanceof ApiError) {
      return apiResponse(null, error.message, error.statusCode);
    }
    console.error('Error creating share link:', error);
    return apiResponse(null, 'Failed to create share link', 500);
  }
}

// GET /api/maps/[id]/share - List all share links for a mind map
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthUser(req);
    const { id: mindMapId } = await params;

    // Verify user has access to this mind map
    const mindMap = await prisma.mindMap.findFirst({
      where: {
        id: mindMapId,
        workspace: {
          members: {
            some: {
              userId: user.id,
            },
          },
        },
      },
    });

    if (!mindMap) {
      throw new ApiError(404, 'Mind map not found');
    }

    const shareLinks = await prisma.shareLink.findMany({
      where: {
        mindMapId,
      },
      select: {
        id: true,
        token: true,
        role: true,
        expiresAt: true,
        createdAt: true,
        password: true,
      },
    });

    const linksWithUrls = shareLinks.map((link) => ({
      id: link.id,
      token: link.token,
      role: link.role,
      expiresAt: link.expiresAt,
      createdAt: link.createdAt,
      hasPassword: !!link.password,
      url: `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/shared/${link.token}`,
    }));

    return apiResponse(linksWithUrls);
  } catch (error) {
    if (error instanceof ApiError) {
      return apiResponse(null, error.message, error.statusCode);
    }
    console.error('Error fetching share links:', error);
    return apiResponse(null, 'Failed to fetch share links', 500);
  }
}

// DELETE /api/maps/[id]/share - Delete all share links or a specific one
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthUser(req);
    const { id: mindMapId } = await params;
    const { searchParams } = new URL(req.url);
    const linkId = searchParams.get('linkId');

    // Verify user has access and is owner
    const mindMap = await prisma.mindMap.findFirst({
      where: {
        id: mindMapId,
        workspace: {
          members: {
            some: {
              userId: user.id,
              role: 'owner',
            },
          },
        },
      },
    });

    if (!mindMap) {
      throw new ApiError(404, 'Mind map not found or insufficient permissions');
    }

    if (linkId) {
      // Delete specific link
      await prisma.shareLink.delete({
        where: {
          id: linkId,
          mindMapId,
        },
      });
    } else {
      // Delete all links for this mind map
      await prisma.shareLink.deleteMany({
        where: {
          mindMapId,
        },
      });
    }

    return apiResponse({ success: true });
  } catch (error) {
    if (error instanceof ApiError) {
      return apiResponse(null, error.message, error.statusCode);
    }
    console.error('Error deleting share links:', error);
    return apiResponse(null, 'Failed to delete share links', 500);
  }
}
