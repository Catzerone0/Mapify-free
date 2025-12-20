import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { apiSuccess } from "@/lib/api-response";
import { z } from "zod";
import { signToken } from "@/lib/auth-tokens";

const schema = z.object({
  email: z.string().email(),
});

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}));
  const { email } = schema.parse(body);

  const user = await db.user.findUnique({ where: { email } });

  // Always respond success to avoid account enumeration.
  if (!user) {
    return apiSuccess({ sent: true });
  }

  const exp = Math.floor(Date.now() / 1000) + 60 * 60;
  const token = signToken({ p: "reset_password", sub: user.id, exp });
  const origin = request.nextUrl.origin;
  const resetUrl = `${origin}/auth/reset-password?token=${encodeURIComponent(token)}`;

  // In production, send resetUrl via email.
  return apiSuccess({ sent: true, resetUrl });
}
