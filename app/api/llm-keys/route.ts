import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { apiFail, apiSuccess } from "@/lib/api-response";
import { extractSession } from "@/lib/middleware";
import {
  ValidationError,
  AuthenticationError,
} from "@/lib/errors";
import { encryptApiKey } from "@/lib/encryption";
import { rateLimiter, rateLimitConfigs } from "@/lib/rate-limit";
import { logger } from "@/lib/logger";
import { z } from "zod";

const addKeySchema = z.object({
  provider: z.enum(["openai", "anthropic", "google"]),
  apiKey: z.string().min(1),
  label: z.string().optional(),
  isDefault: z.boolean().optional(),
});

export async function POST(request: NextRequest) {
  try {
    // Require authentication
    const session = await extractSession(request);
    if (!session) {
      throw new AuthenticationError();
    }

    // Rate limiting
    rateLimiter.check(`llm-key-${session.userId}`, rateLimitConfigs.llmKeys);

    const body = await request.json();

    // Validation
    const result = addKeySchema.safeParse(body);
    if (!result.success) {
      throw new ValidationError("Invalid LLM key data");
    }

    const { provider, apiKey, label, isDefault } = result.data;

    // Encrypt the API key before storing
    const encryptedKey = encryptApiKey(apiKey);

    // If setting as default, unset others for this provider
    if (isDefault) {
      await db.userProviderKey.updateMany({
        where: {
          userId: session.userId,
          provider,
        },
        data: {
          isDefault: false,
        },
      });
    }

    // Create the provider key
    const providerKey = await db.userProviderKey.create({
      data: {
        userId: session.userId,
        provider,
        encryptedKey,
        label: label || `${provider.charAt(0).toUpperCase() + provider.slice(1)} Key`,
        isDefault: isDefault || false,
      },
    });

    logger.info("LLM API key saved", {
      userId: session.userId,
      provider,
    });

    return apiSuccess(
      {
        id: providerKey.id,
        provider: providerKey.provider,
        label: providerKey.label,
        isDefault: providerKey.isDefault,
        createdAt: providerKey.createdAt,
        updatedAt: providerKey.updatedAt,
      },
      201
    );
  } catch (error) {
    logger.error("Failed to save LLM key", error);
    return apiFail(error instanceof Error ? error : "Failed to save LLM key");
  }
}

export async function GET(request: NextRequest) {
  try {
    // Require authentication
    const session = await extractSession(request);
    if (!session) {
      throw new AuthenticationError();
    }

    // Get all provider keys for the user (without decrypted keys)
    const providerKeys = await db.userProviderKey.findMany({
      where: {
        userId: session.userId,
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
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return apiSuccess(providerKeys);
  } catch (error) {
    logger.error("Failed to fetch LLM keys", error);
    return apiFail(error instanceof Error ? error : "Failed to fetch LLM keys");
  }
}
