/**
 * Content ingestion API endpoints
 * POST /api/ingest - Create ingestion job
 * GET /api/ingest - List content sources
 */
import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/middleware';
import { ingestionService } from '@/lib/ingest/service';
import { IngestRequestSchema } from '@/lib/ingest/validation';
import { apiResponse, ApiError } from '@/lib/api-response';
import { applyRateLimit } from '@/lib/rate-limit';
import { logger } from '@/lib/logger';
import type { SourceType, SourcePayload } from '@/lib/ingest/types';

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    // Apply rate limiting
    const rateLimitResult = await applyRateLimit(req, {
      maxRequests: 10,
      windowMs: 60000,
    });

    if (!rateLimitResult.success) {
      return apiResponse(null, 'Rate limit exceeded', 429);
    }

    const user = await getAuthUser(req);

    // Parse request body
    const body = await req.json();
    const validated = IngestRequestSchema.parse(body);

    // Create ingestion job
    const ingestionId = await ingestionService.createIngestionJob({
      workspaceId: validated.workspaceId,
      userId: user.id,
      sourceType: validated.sourceType as SourceType,
      payload: validated.payload as SourcePayload,
    });

    logger.info('Ingestion job created via API', {
      ingestionId,
      sourceType: validated.sourceType,
      userId: user.id,
    });

    return apiResponse({
      ingestionId,
      status: 'pending',
      message: 'Ingestion job created successfully',
    });
  } catch (error) {
    if (error instanceof ApiError) {
      return apiResponse(null, error.message, error.statusCode);
    }

    logger.error('Ingestion API error', error);
    return apiResponse(null, 'Failed to create ingestion job', 500);
  }
}

export async function GET(req: NextRequest): Promise<NextResponse> {
  try {
    const user = await getAuthUser(req);

    // Get query parameters
    const { searchParams } = new URL(req.url);
    const workspaceId = searchParams.get('workspaceId');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    if (!workspaceId) {
      throw new ApiError(400, 'workspaceId is required');
    }

    // List content sources
    const result = await ingestionService.listContentSources(
      workspaceId,
      limit,
      offset
    );

    return apiResponse(result);
  } catch (error) {
    if (error instanceof ApiError) {
      return apiResponse(null, error.message, error.statusCode);
    }

    logger.error('List content sources API error', error);
    return apiResponse(null, 'Failed to list content sources', 500);
  }
}
