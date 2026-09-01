import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { authCookieNames, clearAuthCookies } from "@/lib/auth/auth-cookies";
import { env } from "@/lib/env";

export async function POST(): Promise<NextResponse> {
  const refreshToken = (await cookies()).get(authCookieNames.refresh)?.value;
  if (refreshToken) {
    await fetch(`${env.NEXT_PUBLIC_API_BASE_URL.replace(/\/$/, "")}/auth/logout`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken }),
      cache: "no-store",
    }).catch(() => undefined);
  }
  const response = NextResponse.json({ success: true, data: { loggedOut: true } });
  clearAuthCookies(response);
  return response;
}
