/**
 * Processed content retrieval endpoint
 * GET /api/ingest/[id]/content - Get processed content for LLM pipeline
 */
import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { ingestionService } from '@/lib/ingest/service';
import { apiResponse, apiError } from '@/lib/api-response';
import { AuthError, NotFoundError } from '@/lib/errors';

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

    // Get content source to verify access
    const contentSource = await prisma.contentSource.findUnique({
      where: { id },
      select: {
        workspaceId: true,
        status: true,
      },
    });

    if (!contentSource) {
      throw new NotFoundError('Content source not found');
    }

    // Verify access
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

    // Get processed content
    const processedContent = await ingestionService.getProcessedContent(id);

    if (!processedContent) {
      return apiResponse({
        message: 'Content processing not yet completed',
        status: contentSource.status,
      });
    }

    return apiResponse(processedContent);
  } catch (error) {
    if (error instanceof AuthError) {
      return apiError(error.message, 401);
    }
    if (error instanceof NotFoundError) {
      return apiError(error.message, 404);
    }

    return apiError('Failed to get processed content', 500);
  }
}
