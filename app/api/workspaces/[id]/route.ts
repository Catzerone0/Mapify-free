import { NextRequest } from "next/server";
import db from "@/lib/db";
import { apiFail, apiSuccess } from "@/lib/api-response";
import { extractSession } from "@/lib/middleware";
import { ValidationError, AuthenticationError } from "@/lib/errors";
import { logger } from "@/lib/logger";
import { z } from "zod";

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
                avatar: true,
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

const updateWorkspaceSchema = z.object({
  name: z.string().min(1).optional(),
  icon: z.string().optional(),
  color: z.string().optional(),
  visibility: z.enum(["private", "public"]).optional(),
  settings: z.any().optional(),
});

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await extractSession(request);
    if (!session) throw new AuthenticationError();

    const { id } = await params;
    
    // Check membership and role
    const member = await db.workspaceMember.findUnique({
      where: {
        userId_workspaceId: {
          userId: session.userId,
          workspaceId: id,
        },
      },
    });

    if (!member || member.role !== 'owner') {
        return apiFail("Only workspace owners can update settings", 403);
    }

    const body = await request.json();
    const result = updateWorkspaceSchema.safeParse(body);
    if (!result.success) throw new ValidationError("Invalid workspace data");

    const data = result.data;

    const workspace = await db.workspace.update({
      where: { id },
      data,
    });
    
    return apiSuccess(workspace);
  } catch (error) {
    logger.error("Failed to update workspace", error);
    return apiFail(error instanceof Error ? error : "Failed to update workspace");
  }
}
