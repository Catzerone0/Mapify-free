import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { apiSuccess } from "@/lib/api-response";

export async function POST(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  const bearerToken = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;
  const cookieToken = request.cookies.get("auth-token")?.value || null;
  const token = bearerToken || cookieToken;

  if (token) {
    await db.session.deleteMany({ where: { token } });
  }

  const res = apiSuccess({ success: true });
  res.cookies.set("auth-token", "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });

  return res;
}
