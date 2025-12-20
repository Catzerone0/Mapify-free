import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { apiFail, apiSuccess } from "@/lib/api-response";
import { ValidationError } from "@/lib/errors";
import { verifyToken } from "@/lib/auth-tokens";
import bcrypt from "bcrypt";
import { z } from "zod";

const schema = z.object({
  token: z.string().min(1),
  password: z.string().min(8),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { token, password } = schema.parse(body);

    const payload = verifyToken(token);
    if (payload.p !== "reset_password") {
      throw new ValidationError("Invalid token");
    }

    const user = await db.user.findUnique({ where: { id: payload.sub } });
    if (!user) {
      throw new ValidationError("Invalid token");
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    await db.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
      },
    });

    // Revoke existing sessions for security.
    await db.session.deleteMany({ where: { userId: user.id } });

    return apiSuccess({ success: true });
  } catch (error) {
    return apiFail(error instanceof Error ? error : "Failed to reset password");
  }
}
