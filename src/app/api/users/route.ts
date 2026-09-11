import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import {
  authCookieNames,
  clearAuthCookies,
  setAuthCookies,
} from "@/lib/auth/auth-cookies";
import { requestTokenPair } from "@/lib/auth/backend-auth";
import { env } from "@/lib/env";

export async function GET(request: Request): Promise<Response> {
  return forwardUsersRequest(request, { method: "GET" });
}

export async function POST(request: Request): Promise<Response> {
  return forwardUsersRequest(request, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: await request.text(),
  });
}

async function forwardUsersRequest(
  request: Request,
  init: RequestInit,
): Promise<Response> {
  const cookieStore = await cookies();
  let accessToken = cookieStore.get(authCookieNames.access)?.value;
  let refreshedTokens;

  const url = new URL(
    `admin/users${new URL(request.url).search}`,
    `${env.NEXT_PUBLIC_API_BASE_URL.replace(/\/$/, "")}/`,
  );
  const send = (token: string) =>
    fetch(url, {
      ...init,
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
        ...init.headers,
      },
      cache: "no-store",
    });

  try {
    const refreshToken = cookieStore.get(authCookieNames.refresh)?.value;
    if (!accessToken && refreshToken) {
      const refreshed = await requestTokenPair(
        "/auth/refresh",
        { refreshToken },
        request,
      );
      refreshedTokens = refreshed.tokens;
      accessToken = refreshedTokens?.accessToken;
    }

    if (!accessToken) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "UNAUTHENTICATED",
            message: "Authentication required",
          },
        },
        { status: 401 },
      );
    }

    let backendResponse = await send(accessToken);

    if (backendResponse.status === 401) {
      if (refreshToken) {
        const refreshed = await requestTokenPair(
          "/auth/refresh",
          { refreshToken },
          request,
        );
        refreshedTokens = refreshed.tokens;
        if (refreshedTokens) {
          backendResponse = await send(refreshedTokens.accessToken);
        }
      }
    }

    const response = new NextResponse(await backendResponse.text(), {
      status: backendResponse.status,
      headers: {
        "content-type":
          backendResponse.headers.get("content-type") ?? "application/json",
      },
    });
    if (refreshedTokens) setAuthCookies(response, refreshedTokens);
    if (backendResponse.status === 401) clearAuthCookies(response);
    return response;
  } catch {
    return NextResponse.json(
      {
        success: false,
        error: { code: "SERVICE_UNAVAILABLE", message: "Backend unavailable" },
      },
      { status: 503 },
    );
  }
}