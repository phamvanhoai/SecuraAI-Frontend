import { NextResponse, type NextRequest } from "next/server";
import { authCookieNames } from "@/lib/auth/auth-cookies";

const protectedPrefixes = [
  "/dashboard",
  "/admin",
  "/security-officer",
  "/employee",
  "/executive-auditor",
  "/users",
  "/assets",
  "/risks",
  "/incidents",
  "/controls",
  "/audits",
  "/reports",
  "/notifications",
  "/files",
  "/settings",
  "/policies",
  "/anomaly-monitoring",
  "/ai-models",
  "/event-logs",
  "/profile",
  "/change-password",
  "/login-history",
  "/forbidden",
] as const;

export function proxy(request: NextRequest): NextResponse {
  const { pathname, search } = request.nextUrl;
  const hasSession =
    request.cookies.has(authCookieNames.access) ||
    request.cookies.has(authCookieNames.refresh);

  if (
    protectedPrefixes.some(
      (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
    )
  ) {
    if (!hasSession) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("returnUrl", `${pathname}${search}`);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/login",
    "/dashboard/:path*",
    "/admin/:path*",
    "/security-officer/:path*",
    "/employee/:path*",
    "/executive-auditor/:path*",
    "/users/:path*",
    "/assets/:path*",
    "/risks/:path*",
    "/incidents/:path*",
    "/controls/:path*",
    "/audits/:path*",
    "/reports/:path*",
    "/notifications/:path*",
    "/files/:path*",
    "/settings/:path*",
    "/policies/:path*",
    "/anomaly-monitoring/:path*",
    "/ai-models/:path*",
    "/event-logs/:path*",
    "/profile/:path*",
    "/change-password/:path*",
    "/login-history/:path*",
    "/forbidden/:path*",
  ],
};
