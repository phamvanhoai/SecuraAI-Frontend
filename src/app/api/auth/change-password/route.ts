import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import {
  authCookieNames,
  clearAuthCookies,
  setAuthCookies,
} from "@/lib/auth/auth-cookies";
import { requestTokenPair, type AuthTokenPair } from "@/lib/auth/backend-auth";
import { env } from "@/lib/env";

function unauthorized(): NextResponse {
  const response = NextResponse.json(
    {
      success: false,
      error: { code: "UNAUTHENTICATED", message: "Authentication required" },
    },
    { status: 401 },
  );
  clearAuthCookies(response);
  return response;
}

async function sendChangePassword(
  accessToken: string,
  body: string,
): Promise<Response> {
  return fetch(
    `${env.NEXT_PUBLIC_API_BASE_URL.replace(/\/$/, "")}/auth/change-password`,
    {
      method: "POST",
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body,
      cache: "no-store",
    },
  );
}

async function toNextResponse(
  backendResponse: Response,
  refreshedTokens?: AuthTokenPair,
): Promise<NextResponse> {
  const response = new NextResponse(await backendResponse.text(), {
    status: backendResponse.status,
    headers: {
      "Content-Type":
        backendResponse.headers.get("content-type") ?? "application/json",
    },
  });
  if (refreshedTokens) setAuthCookies(response, refreshedTokens);
  return response;
}

export async function POST(request: Request): Promise<NextResponse> {
  const body = await request.text();
  const cookieStore = await cookies();
  const accessToken = cookieStore.get(authCookieNames.access)?.value;
  const refreshToken = cookieStore.get(authCookieNames.refresh)?.value;

  try {
    if (accessToken) {
      const firstResponse = await sendChangePassword(accessToken, body);
      if (firstResponse.status !== 401) return toNextResponse(firstResponse);
    }

    if (!refreshToken) return unauthorized();
    const refreshed = await requestTokenPair(
      "/auth/refresh",
      { refreshToken },
      request,
    );
    if (!refreshed.tokens) return unauthorized();

    const retriedResponse = await sendChangePassword(
      refreshed.tokens.accessToken,
      body,
    );
    return toNextResponse(retriedResponse, refreshed.tokens);
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
