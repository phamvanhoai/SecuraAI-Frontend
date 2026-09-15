import "server-only";

import type { NextResponse } from "next/server";

export const authCookieNames = {
  access: "securaai_access",
  refresh: "securaai_refresh",
  mfaChallenge: "securaai_mfa_challenge",
} as const;

const secure = process.env.NODE_ENV === "production";

export function setAuthCookies(
  response: NextResponse,
  tokens: { accessToken: string; refreshToken: string },
): void {
  response.cookies.set(authCookieNames.access, tokens.accessToken, {
    httpOnly: true,
    secure,
    sameSite: "lax",
    path: "/",
    maxAge: 15 * 60,
  });
  response.cookies.set(authCookieNames.refresh, tokens.refreshToken, {
    httpOnly: true,
    secure,
    sameSite: "strict",
    path: "/",
    maxAge: 7 * 24 * 60 * 60,
  });
}

export function setMfaChallengeCookie(
  response: NextResponse,
  challengeToken: string,
  expiresIn: number,
): void {
  response.cookies.set(authCookieNames.mfaChallenge, challengeToken, {
    httpOnly: true,
    secure,
    sameSite: "strict",
    path: "/api/auth/mfa/challenge",
    maxAge: Math.min(expiresIn, 5 * 60),
  });
}

export function clearMfaChallengeCookie(response: NextResponse): void {
  response.cookies.set(authCookieNames.mfaChallenge, "", {
    httpOnly: true,
    secure,
    sameSite: "strict",
    path: "/api/auth/mfa/challenge",
    maxAge: 0,
  });
}

export function clearAuthCookies(response: NextResponse): void {
  response.cookies.set(authCookieNames.access, "", {
    httpOnly: true,
    secure,
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
  response.cookies.set(authCookieNames.refresh, "", {
    httpOnly: true,
    secure,
    sameSite: "strict",
    path: "/",
    maxAge: 0,
  });
}
