import { NextRequest } from "next/server";
import { db } from "./db";
import { AuthenticationError, AuthorizationError } from "./errors";
import { logger } from "./logger";

export interface RequestContext {
  userId: string;
  workspaceId: string;
  token: string;
  userRole: string;
}

export async function extractSession(
  request: NextRequest
): Promise<RequestContext | null> {
  const authHeader = request.headers.get("authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return null;
  }

  const token = authHeader.slice(7);

  try {
    const session = await db.session.findUnique({
      where: { token },
      include: {
        user: true,
      },
    });

    if (!session || session.expiresAt < new Date()) {
      return null;
    }

    // Get user's active workspace (from query param or default)
    const workspaceId =
      request.nextUrl.searchParams.get("workspaceId") || "";

    // If workspaceId is provided, validate membership
    let userRole = "member"; // default role
    if (workspaceId) {
      const membership = await db.workspaceMember.findUnique({
        where: {
          userId_workspaceId: {
            userId: session.userId,
            workspaceId,
          },
        },
      });

      if (!membership) {
        return null;
      }
      userRole = membership.role;
    }

    return {
      userId: session.userId,
      workspaceId: workspaceId || "", // Empty string if no workspaceId provided
      token,
      userRole,
    };
  } catch (error) {
    logger.error("Failed to extract session", error);
    return null;
  }
}

export function requireAuth(
  handler: (request: NextRequest, context: unknown, session: RequestContext) => Promise<Response>
) {
  return async (request: NextRequest, context: unknown) => {
    const session = await extractSession(request);
    if (!session) {
      throw new AuthenticationError();
    }
    return handler(request, context, session);
  };
}

export function requireWorkspaceOwner(
  handler: (request: NextRequest, context: unknown, session: RequestContext) => Promise<Response>
) {
  return async (request: NextRequest, context: unknown) => {
    const session = await extractSession(request);
    if (!session) {
      throw new AuthenticationError();
    }
    if (session.userRole !== "owner") {
      throw new AuthorizationError("Owner permission required");
    }
    return handler(request, context, session);
  };
}

// Helper function to get authenticated user - for use in API routes
export async function getAuthUser(req: NextRequest): Promise<{ id: string; email: string }> {
  const authHeader = req.headers.get("authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    throw new AuthenticationError("Authentication required");
  }

  const token = authHeader.slice(7);

  try {
    const session = await db.session.findUnique({
      where: { token },
      include: {
        user: true,
      },
    });

    if (!session || session.expiresAt < new Date()) {
      throw new AuthenticationError("Invalid or expired token");
    }

    return {
      id: session.userId,
      email: session.user.email,
    };
  } catch (error) {
    if (error instanceof AuthenticationError) {
      throw error;
    }
    logger.error("Failed to authenticate request", error);
    throw new AuthenticationError("Authentication failed");
  }
}
