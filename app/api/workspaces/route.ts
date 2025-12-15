import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { apiFail, apiSuccess } from "@/lib/api-response";
import { extractSession } from "@/lib/middleware";
import { ValidationError, AuthenticationError } from "@/lib/errors";
import { logger } from "@/lib/logger";
import { z } from "zod";

const createWorkspaceSchema = z.object({
  name: z.string().min(1).max(255),
});

export async function POST(request: NextRequest) {
  try {
    // Require authentication
    const session = await extractSession(request);
    if (!session) {
      throw new AuthenticationError();
    }

    const body = await request.json();

    // Validation
    const result = createWorkspaceSchema.safeParse(body);
    if (!result.success) {
      throw new ValidationError("Invalid workspace data");
    }

    const { name } = result.data;

    // Create workspace
    const workspace = await db.workspace.create({
      data: {
        name,
        members: {
          create: {
            userId: session.userId,
            role: "owner",
          },
        },
      },
      include: {
        members: true,
      },
    });

    logger.info("Workspace created", {
      workspaceId: workspace.id,
      userId: session.userId,
      name,
    });

    return apiSuccess(workspace, 201);
  } catch (error) {
    logger.error("Workspace creation error", error);
    return apiFail(error instanceof Error ? error : "Failed to create workspace");
  }
}

export async function GET(request: NextRequest) {
  try {
    // Require authentication
    const session = await extractSession(request);
    if (!session) {
      throw new AuthenticationError();
    }

    // Get all workspaces for the user
    const workspaces = await db.workspace.findMany({
      where: {
        members: {
          some: {
            userId: session.userId,
          },
        },
      },
      include: {
        members: true,
      },
    });

    return apiSuccess(workspaces);
  } catch (error) {
    logger.error("Failed to fetch workspaces", error);
    return apiFail(error instanceof Error ? error : "Failed to fetch workspaces");
  }
}
