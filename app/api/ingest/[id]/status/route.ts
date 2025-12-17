/**
 * Content ingestion status endpoint
 * GET /api/ingest/[id]/status - Get ingestion status
 */
import { NextRequest, NextResponse } from 'next/server';
import { db as prisma } from '@/lib/db';
import { getAuthUser } from '@/lib/middleware';
import { ingestionService } from '@/lib/ingest/service';
import { apiResponse, ApiError } from '@/lib/api-response';

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const user = await getAuthUser(req);
    const { id } = await context.params;

    // Get content source to verify access
    const contentSource = await prisma.contentSource.findUnique({
      where: { id },
      select: {
        workspaceId: true,
      },
    });

    if (!contentSource) {
      throw new ApiError(404, 'Content source not found');
    }

    // Verify access
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

    // Get status
    const status = await ingestionService.getIngestionStatus(id);

    return apiResponse(status);
  } catch (error) {
    if (error instanceof ApiError) {
      return apiResponse(null, error.message, error.statusCode);
    }

    return apiResponse(null, 'Failed to get ingestion status', 500);
  }
}
