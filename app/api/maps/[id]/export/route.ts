import { NextRequest, NextResponse } from 'next/server';
import { db as prisma } from '@/lib/db';
import { requireAuth } from '@/lib/middleware';
import { apiResponse, ApiError } from '@/lib/api-response';
import { ExportService } from '@/lib/export/export-service';

// GET /api/maps/[id]/export?format=markdown|text|json
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth(req);
    const { id: mindMapId } = await params;
    const { searchParams } = new URL(req.url);
    const format = searchParams.get('format') || 'markdown';

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
      throw new ApiError('Mind map not found', 404);
    }

    let exportResult;

    switch (format) {
      case 'markdown':
        exportResult = await ExportService.exportToMarkdown(mindMapId);
        break;
      case 'text':
        exportResult = await ExportService.exportToText(mindMapId);
        break;
      case 'json':
        exportResult = await ExportService.exportToJSON(mindMapId);
        break;
      default:
        throw new ApiError('Invalid export format', 400);
    }

    // Return as downloadable file
    return new NextResponse(exportResult.content, {
      headers: {
        'Content-Type': exportResult.mimeType,
        'Content-Disposition': `attachment; filename="${exportResult.filename}"`,
      },
    });
  } catch (error) {
    if (error instanceof ApiError) {
      return apiResponse(null, error.message, error.statusCode);
    }
    console.error('Error exporting mind map:', error);
    return apiResponse(null, 'Failed to export mind map', 500);
  }
}
