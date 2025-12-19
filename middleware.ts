import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const publicPaths = [
  "/auth/login",
  "/auth/signup",
  "/api/auth/login",
  "/api/auth/register",
  "/api/health",
  "/api/shared",
];

const protectedPaths = [
  "/dashboard",
  "/mindmap",
  "/workspace",
  "/settings",
  "/onboarding",
];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

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
