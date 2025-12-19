import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { apiFail, apiSuccess } from "@/lib/api-response";
import { extractSession } from "@/lib/middleware";
import {
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  ValidationError,
} from "@/lib/errors";
import { logger } from "@/lib/logger";
import { z } from "zod";

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

const updateKeySchema = z.object({
  label: z.string().optional(),
  isDefault: z.boolean().optional(),
});

export async function PATCH(
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

    const body = await request.json();

    const result = updateKeySchema.safeParse(body);
    if (!result.success) {
      throw new ValidationError("Invalid update data");
    }

    const { label, isDefault } = result.data;

    // Get the provider key
    const providerKey = await db.userProviderKey.findUnique({
      where: { id },
    });

    if (!providerKey) {
      throw new NotFoundError("Provider key");
    }

    // Check ownership
    if (providerKey.userId !== session.userId) {
      throw new AuthorizationError("Cannot update this key");
    }

    // If setting as default, unset others for this provider
    if (isDefault) {
      await db.userProviderKey.updateMany({
        where: {
          userId: session.userId,
          provider: providerKey.provider,
        },
        data: {
          isDefault: false,
        },
      });
    }

    // Update the key
    const updatedKey = await db.userProviderKey.update({
      where: { id },
      data: {
        label: label !== undefined ? label : undefined,
        isDefault: isDefault !== undefined ? isDefault : undefined,
      },
      select: {
        id: true,
        provider: true,
        label: true,
        isDefault: true,
        usage: true,
        lastUsedAt: true,
        createdAt: true,
        updatedAt: true,
      }
    });

    logger.info("LLM API key updated", {
      userId: session.userId,
      keyId: id,
    });

    return apiSuccess(updatedKey);
  } catch (error) {
    logger.error("Failed to update LLM key", error);
    return apiFail(error instanceof Error ? error : "Failed to update LLM key");
  }
}
