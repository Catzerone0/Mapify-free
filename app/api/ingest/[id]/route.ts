/**
 * Content source detail endpoints
 * GET /api/ingest/[id] - Get content source details
 * DELETE /api/ingest/[id] - Delete content source
 */
import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { ingestionService } from '@/lib/ingest/service';
import { apiResponse, apiError } from '@/lib/api-response';
import { AuthError, NotFoundError } from '@/lib/errors';
import { logger } from '@/lib/logger';

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    // Authenticate user
    const session = await getSession(req);
    if (!session) {
      throw new AuthError('Authentication required');
    }

    const { id } = await context.params;

    // Get content source
    const contentSource = await prisma.contentSource.findUnique({
      where: { id },
      include: {
        workspace: true,
      },
    });

    if (!contentSource) {
      throw new NotFoundError('Content source not found');
    }

    // Verify access (user must be member of workspace)
    const member = await prisma.workspaceMember.findUnique({
      where: {
        userId_workspaceId: {
          userId: session.userId,
          workspaceId: contentSource.workspaceId,
        },
      },
    });

    if (!member) {
      throw new AuthError('Access denied');
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
    if (error instanceof AuthError) {
      return apiError(error.message, 401);
    }
    if (error instanceof NotFoundError) {
      return apiError(error.message, 404);
    }

    logger.error('Get content source API error', error);
    return apiError('Failed to get content source', 500);
  }
}

export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    // Authenticate user
    const session = await getSession(req);
    if (!session) {
      throw new AuthError('Authentication required');
    }

    const { id } = await context.params;

    // Get content source
    const contentSource = await prisma.contentSource.findUnique({
      where: { id },
    });

    if (!contentSource) {
      throw new NotFoundError('Content source not found');
    }

    // Verify access (user must be member of workspace)
    const member = await prisma.workspaceMember.findUnique({
      where: {
        userId_workspaceId: {
          userId: session.userId,
          workspaceId: contentSource.workspaceId,
        },
      },
    });

    if (!member) {
      throw new AuthError('Access denied');
    }

    // Delete content source
    await ingestionService.deleteContentSource(id);

    logger.info('Content source deleted via API', {
      contentSourceId: id,
      userId: session.userId,
    });

    return apiResponse({
      message: 'Content source deleted successfully',
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return apiError(error.message, 401);
    }
    if (error instanceof NotFoundError) {
      return apiError(error.message, 404);
    }

    logger.error('Delete content source API error', error);
    return apiError('Failed to delete content source', 500);
  }
}
