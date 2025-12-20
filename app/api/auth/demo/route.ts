import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { apiSuccess } from "@/lib/api-response";
import bcrypt from "bcrypt";
import { randomBytes } from "crypto";

export async function POST(request: NextRequest) {
  const origin = request.nextUrl.origin;

  const email = "demo@mapify.local";
  const password = randomBytes(12).toString("hex");

  let user = await db.user.findUnique({ where: { email } });

  if (!user) {
    const hashedPassword = await bcrypt.hash(password, 12);
    user = await db.user.create({
      data: {
        email,
        password: hashedPassword,
        name: "Demo User",
        preferences: {
          emailVerified: true,
          onboardingComplete: true,
          demo: true,
        },
      },
    });

    // Create a default workspace for demo
    await db.workspace.create({
      data: {
        name: "Demo Workspace",
        visibility: "private",
        members: {
          create: {
            userId: user.id,
            role: "owner",
          },
        },
      },
    });
  }

  const token = randomBytes(32).toString("hex");
  const maxAgeSeconds = 7 * 24 * 60 * 60;
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
    redirectTo: `${origin}/dashboard`,
  });

  res.cookies.set("auth-token", session.token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: maxAgeSeconds,
  });

  return res;
}
