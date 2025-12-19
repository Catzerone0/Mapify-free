import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { apiFail, apiSuccess } from "@/lib/api-response";
import {
  ValidationError,
  AuthenticationError,
} from "@/lib/errors";
import { rateLimiter, rateLimitConfigs } from "@/lib/rate-limit";
import { logger } from "@/lib/logger";
import bcrypt from "bcrypt";
import { z } from "zod";
import { randomBytes } from "crypto";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
  rememberMe: z.boolean().optional(),
});

export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const clientIp = request.headers.get("x-forwarded-for") || "unknown";
    rateLimiter.check(`login-${clientIp}`, rateLimitConfigs.auth);

    const body = await request.json();

    // Validation
    const result = loginSchema.safeParse(body);
    if (!result.success) {
      throw new ValidationError("Invalid login data");
    }

    const { email, password, rememberMe } = result.data;

    // Find user
    const user = await db.user.findUnique({
      where: { email },
    });

    if (!user || !user.password) {
      throw new AuthenticationError("Invalid email or password");
    }

    const isVerified = (user.preferences as { emailVerified?: boolean } | null)?.emailVerified;
    if (isVerified === false) {
      throw new AuthenticationError(
        "Please verify your email address before signing in. Check your inbox for a verification link."
      );
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new AuthenticationError("Invalid email or password");
    }

    const maxAgeSeconds = rememberMe ? 30 * 24 * 60 * 60 : 24 * 60 * 60;

    // Create session token
    const token = randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + maxAgeSeconds * 1000);

    const session = await db.session.create({
      data: {
        userId: user.id,
        token,
        expiresAt,
      },
    });

    logger.info("User logged in", {
      userId: user.id,
      email: user.email,
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
    logger.error("Login error", error);
    return apiFail(error instanceof Error ? error : "Login failed");
  }
}
