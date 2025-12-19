import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { apiFail, apiSuccess } from "@/lib/api-response";
import { extractSession } from "@/lib/middleware";
import { AuthenticationError, ValidationError } from "@/lib/errors";
import { logger } from "@/lib/logger";
import { z } from "zod";

const updateProfileSchema = z.object({
  name: z.string().optional(),
  bio: z.string().optional(),
  language: z.string().optional(),
  theme: z.enum(["light", "dark", "auto"]).optional(),
  preferences: z.any().optional(), // Flexible JSON
  avatar: z.string().url().optional().or(z.literal("")),
});

export async function GET(request: NextRequest) {
  try {
    const session = await extractSession(request);
    if (!session) throw new AuthenticationError();

    const user = await db.user.findUnique({
      where: { id: session.userId },
      select: {
        id: true,
        name: true,
        email: true,
        avatar: true,
        bio: true,
        language: true,
        theme: true,
        preferences: true,
        createdAt: true,
      }
    });

    if (!user) throw new AuthenticationError();

    return apiSuccess(user);
  } catch (error) {
    logger.error("Failed to fetch user profile", error);
    return apiFail(error instanceof Error ? error : "Failed to fetch user profile");
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await extractSession(request);
    if (!session) throw new AuthenticationError();

    const body = await request.json();
    const result = updateProfileSchema.safeParse(body);
    if (!result.success) throw new ValidationError("Invalid profile data");

    const data = result.data;

    const user = await db.user.update({
      where: { id: session.userId },
      data,
      select: {
        id: true,
        name: true,
        email: true,
        avatar: true,
        bio: true,
        language: true,
        theme: true,
        preferences: true,
        updatedAt: true,
      }
    });

    return apiSuccess(user);
  } catch (error) {
    logger.error("Failed to update user profile", error);
    return apiFail(error instanceof Error ? error : "Failed to update user profile");
  }
}
