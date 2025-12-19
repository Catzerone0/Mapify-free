import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { apiSuccess } from "@/lib/api-response";

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  const bearerToken = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;
  const cookieToken = request.cookies.get("auth-token")?.value || null;
  const token = bearerToken || cookieToken;

  if (!token) {
    return apiSuccess({ user: null });
  }

  const session = await db.session.findUnique({
    where: { token },
    include: { user: true },
  });

  if (!session || session.expiresAt < new Date()) {
    return apiSuccess({ user: null });
  }

  return apiSuccess({
    token: session.token,
    user: {
      id: session.userId,
      email: session.user.email,
      name: session.user.name,
    },
  });
}
