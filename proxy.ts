import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const publicPaths = [
  "/auth/login",
  "/auth/signup",
  "/auth/verify-email",
  "/auth/forgot-password",
  "/auth/reset-password",
  "/help",
  "/contact",

  "/api/auth/login",
  "/api/auth/register",
  "/api/auth/verify-email",
  "/api/auth/request-password-reset",
  "/api/auth/reset-password",
  "/api/auth/me",
  "/api/auth/logout",
  "/api/auth/demo",

  "/api/health",
  "/api/shared",
  "/shared",
];

const protectedPaths = [
  "/dashboard",
  "/mindmap",
  "/workspace",
  "/settings",
  "/onboarding",
  "/maps",
  "/templates",
  "/shared-with-me",
  "/activity",
];

export default function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname === "/") {
    return NextResponse.next();
  }

  if (publicPaths.some((path) => pathname.startsWith(path))) {
    return NextResponse.next();
  }

  if (protectedPaths.some((path) => pathname.startsWith(path))) {
    const authHeader = request.headers.get("authorization");
    const hasAuthCookie = request.cookies.has("auth-token");

    if (!authHeader && !hasAuthCookie) {
      const loginUrl = new URL("/auth/login", request.url);
      loginUrl.searchParams.set("from", pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|public).*)",
  ],
};
