import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { apiFail, apiSuccess } from "@/lib/api-response";
import { extractSession } from "@/lib/middleware";
import {
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
} from "@/lib/errors";
import { logger } from "@/lib/logger";

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    // Require authentication
    const session = await extractSession(request);
    if (!session) {
      throw new AuthenticationError();
    }

    const params = await context.params;
    const { id } = params;

    // Get the provider key
    const providerKey = await db.userProviderKey.findUnique({
      where: { id },
    });

    if (!providerKey) {
      throw new NotFoundError("Provider key");
    }

    // Check ownership
    if (providerKey.userId !== session.userId) {
      throw new AuthorizationError("Cannot delete this key");
    }

    // Delete the key
    await db.userProviderKey.delete({
      where: { id },
    });

    logger.info("LLM API key deleted", {
      userId: session.userId,
      keyId: id,
    });

    return apiSuccess({
      success: true,
    });
  } catch (error) {
    logger.error("Failed to delete LLM key", error);
    return apiFail(error instanceof Error ? error : "Failed to delete LLM key");
  }
}
