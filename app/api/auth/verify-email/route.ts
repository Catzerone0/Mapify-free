import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { apiFail, apiSuccess } from "@/lib/api-response";
import { ValidationError } from "@/lib/errors";
import { verifyToken } from "@/lib/auth-tokens";
import { randomBytes } from "crypto";

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as { token?: string };
    if (!body.token) {
      throw new ValidationError("Token is required");
    }

    const payload = verifyToken(body.token);
    if (payload.p !== "verify_email") {
      throw new ValidationError("Invalid token");
    }

    const user = await db.user.findUnique({ where: { id: payload.sub } });
    if (!user) {
      throw new ValidationError("Invalid token");
    }

    const preferences = (user.preferences as Record<string, unknown> | null) || {};

    await db.user.update({
      where: { id: user.id },
      data: {
        preferences: {
          ...preferences,
          emailVerified: true,
        },
      },
    });

    const token = randomBytes(32).toString("hex");
    const maxAgeSeconds = 30 * 24 * 60 * 60;
    const expiresAt = new Date(Date.now() + maxAgeSeconds * 1000);

    const session = await db.session.create({
      data: {
        userId: user.id,
        token,
        expiresAt,
      },
    });

    const res = apiSuccess({
      token: session.token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
    });

    res.cookies.set("auth-token", session.token, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: maxAgeSeconds,
    });

    return res;
  } catch (error) {
    return apiFail(error instanceof Error ? error : "Email verification failed");
  }
}
