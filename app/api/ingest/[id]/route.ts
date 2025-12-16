/**
 * Content source detail endpoints
 * GET /api/ingest/[id] - Get content source details
 * DELETE /api/ingest/[id] - Delete content source
 */
import { NextRequest, NextResponse } from 'next/server';
import { db as prisma } from '@/lib/db';
import { getAuthUser } from '@/lib/middleware';
import { ingestionService } from '@/lib/ingest/service';
import { apiResponse, ApiError } from '@/lib/api-response';
import { logger } from '@/lib/logger';

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const user = await getAuthUser(req);
    const { id } = await context.params;

    // Get content source
    const contentSource = await prisma.contentSource.findUnique({
      where: { id },
      include: {
        workspace: true,
      },
    });

    if (!contentSource) {
      throw new ApiError(404, 'Content source not found');
    }

    // Verify access (user must be member of workspace)
    const member = await prisma.workspaceMember.findUnique({
      where: {
        userId_workspaceId: {
          userId: user.id,
          workspaceId: contentSource.workspaceId,
        },
      },
    });

    if (!member) {
      throw new ApiError(403, 'Access denied');
    }

    return apiResponse({
      id: contentSource.id,
      sourceType: contentSource.sourceType,
      status: contentSource.status,
      metadata: contentSource.metadata,
      sizeBytes: contentSource.sizeBytes,
      error: contentSource.error,
      createdAt: contentSource.createdAt,
      updatedAt: contentSource.updatedAt,
    });
  } catch (error) {
    if (error instanceof ApiError) {
      return apiResponse(null, error.message, error.statusCode);
    }

    logger.error('Get content source API error', error);
    return apiResponse(null, 'Failed to get content source', 500);
  }
}

export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const user = await getAuthUser(req);
    const { id } = await context.params;

    // Get content source
    const contentSource = await prisma.contentSource.findUnique({
      where: { id },
    });

    if (!contentSource) {
      throw new ApiError(404, 'Content source not found');
    }

    // Verify access (user must be member of workspace)
    const member = await prisma.workspaceMember.findUnique({
      where: {
        userId_workspaceId: {
          userId: user.id,
          workspaceId: contentSource.workspaceId,
        },
      },
    });

    if (!member) {
      throw new ApiError(403, 'Access denied');
    }

    // Delete content source
    await ingestionService.deleteContentSource(id);

    logger.info('Content source deleted via API', {
      contentSourceId: id,
      userId: user.id,
    });

    return apiResponse({
      message: 'Content source deleted successfully',
    });
  } catch (error) {
    if (error instanceof ApiError) {
      return apiResponse(null, error.message, error.statusCode);
    }

    logger.error('Delete content source API error', error);
    return apiResponse(null, 'Failed to delete content source', 500);
  }
}
