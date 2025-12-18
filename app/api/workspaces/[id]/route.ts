import { NextRequest } from "next/server";
import db from "@/lib/db";
import { apiFail, apiSuccess } from "@/lib/api-response";
import { extractSession } from "@/lib/middleware";
import { ValidationError, AuthenticationError } from "@/lib/errors";
import { logger } from "@/lib/logger";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    // Require authentication
    const session = await extractSession(request);
    if (!session) {
      throw new AuthenticationError();
    }

    const { id } = await params;

    if (!id) {
      throw new ValidationError("Workspace ID is required");
    }

    // Get workspace with membership check and include related data
    const workspace = await db.workspace.findFirst({
      where: {
        id,
        members: {
          some: {
            userId: session.userId,
          },
        },
      },
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
        mindMaps: {
          select: {
            id: true,
            title: true,
            description: true,
            createdAt: true,
            updatedAt: true,
          },
          orderBy: {
            createdAt: "desc",
          },
        },
      },
    });

    if (!workspace) {
      return apiFail("Workspace not found", 404);
    }

    return apiSuccess(workspace);
  } catch (error) {
    logger.error("Failed to fetch workspace", error);
    return apiFail(error instanceof Error ? error : "Failed to fetch workspace");
  }
}