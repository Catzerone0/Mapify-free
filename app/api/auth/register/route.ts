import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { apiFail, apiSuccess } from "@/lib/api-response";
import { ValidationError, ConflictError } from "@/lib/errors";
import { rateLimiter, rateLimitConfigs } from "@/lib/rate-limit";
import { logger } from "@/lib/logger";
import bcrypt from "bcrypt";
import { z } from "zod";
import { signToken } from "@/lib/auth-tokens";

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const clientIp = request.headers.get("x-forwarded-for") || "unknown";
    rateLimiter.check(`register-${clientIp}`, rateLimitConfigs.auth);

    const body = await request.json();

    // Validation
    const result = registerSchema.safeParse(body);
    if (!result.success) {
      throw new ValidationError("Invalid registration data");
    }

    const { email, password, name } = result.data;

    // Check if user exists
    const existingUser = await db.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw new ConflictError("User with this email already exists");
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create user (requires email verification by default)
    const user = await db.user.create({
      data: {
        email,
        password: hashedPassword,
        name: name || email.split("@")[0],
        preferences: JSON.stringify({
          emailVerified: false,
          onboardingComplete: false,
        }),
      },
    });

    const exp = Math.floor(Date.now() / 1000) + 24 * 60 * 60;
    const token = signToken({
      p: "verify_email",
      sub: user.id,
      exp,
    });

    const origin = request.nextUrl.origin;
    const verifyUrl = `${origin}/auth/verify-email?token=${encodeURIComponent(token)}`;

    logger.info("User registered", {
      userId: user.id,
      email: user.email,
    });

    return apiSuccess(
      {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
        },
        requiresEmailVerification: true,
        verifyUrl,
      },
      201
    );
  } catch (error) {
    logger.error("Registration error", error);
    return apiFail(error instanceof Error ? error : "Registration failed");
  }
}
