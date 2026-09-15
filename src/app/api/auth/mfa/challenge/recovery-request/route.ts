import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import {
  authCookieNames,
  clearMfaChallengeCookie,
} from "@/lib/auth/auth-cookies";
import { env } from "@/lib/env";

export async function POST(): Promise<NextResponse> {
  const challengeToken = (await cookies()).get(
    authCookieNames.mfaChallenge,
  )?.value;
  if (!challengeToken)
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "INVALID_MFA_CHALLENGE",
          message: "Your verification session has expired. Sign in again.",
        },
      },
      { status: 401 },
    );
  try {
    const backend = await fetch(
      `${env.NEXT_PUBLIC_API_BASE_URL.replace(/\/$/, "")}/auth/mfa/recovery-requests`,
      {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ challengeToken }),
        cache: "no-store",
      },
    );
    const response = new NextResponse(await backend.text(), {
      status: backend.status,
      headers: {
        "content-type":
          backend.headers.get("content-type") ?? "application/json",
      },
    });
    if (backend.ok || backend.status === 401) clearMfaChallengeCookie(response);
    return response;
  } catch {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "SERVICE_UNAVAILABLE",
          message: "Unable to connect to the authentication service.",
        },
      },
      { status: 503 },
    );
  }
}
