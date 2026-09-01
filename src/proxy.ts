import { NextResponse, type NextRequest } from "next/server";
import { authCookieNames } from "@/lib/auth/auth-cookies";

const protectedPrefixes = [
  "/dashboard",
  "/users",
  "/roles",
  "/assets",
  "/risks",
  "/incidents",
  "/controls",
  "/compliance",
  "/audits",
  "/reports",
  "/notifications",
  "/files",
  "/settings",
] as const;

export function proxy(request: NextRequest): NextResponse {
  const { pathname, search } = request.nextUrl;
  const hasSession =
    request.cookies.has(authCookieNames.access) || request.cookies.has(authCookieNames.refresh);

  if (protectedPrefixes.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`))) {
    if (!hasSession) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("returnUrl", `${pathname}${search}`);
      return NextResponse.redirect(loginUrl);
    }
  }

  if (pathname === "/login" && hasSession) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/login",
    "/dashboard/:path*",
    "/users/:path*",
    "/roles/:path*",
    "/assets/:path*",
    "/risks/:path*",
    "/incidents/:path*",
    "/controls/:path*",
    "/compliance/:path*",
    "/audits/:path*",
    "/reports/:path*",
    "/notifications/:path*",
    "/files/:path*",
    "/settings/:path*",
  ],
};
