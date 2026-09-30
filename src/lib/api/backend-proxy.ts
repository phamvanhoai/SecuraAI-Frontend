import "server-only";

import { cookies, headers } from "next/headers";
import { NextResponse } from "next/server";
import {
  authCookieNames,
  clearAuthCookies,
  setAuthCookies,
} from "@/lib/auth/auth-cookies";
import { requestTokenPair } from "@/lib/auth/backend-auth";
import { env } from "@/lib/env";

function backendUrl(path: string): string {
  return `${env.NEXT_PUBLIC_API_BASE_URL.replace(/\/$/, "")}${path}`;
}

export async function proxyAuthenticatedRequest(
  path: string,
  init: RequestInit = {},
): Promise<Response> {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get(authCookieNames.access)?.value;
  const refreshToken = cookieStore.get(authCookieNames.refresh)?.value;
  const requestHeaders = await headers();

  const send = (token: string) =>
    fetch(backendUrl(path), {
      ...init,
      cache: "no-store",
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
        ...init.headers,
      },
    });

  try {
    let backendResponse = accessToken
      ? await send(accessToken)
      : new Response(null, { status: 401 });
    let refreshedTokens;

    if (backendResponse.status === 401 && refreshToken) {
      const userAgent = requestHeaders.get("user-agent");
      const refreshRequest = new Request("http://localhost/api/auth/refresh", {
        headers: {
          ...(userAgent ? { "User-Agent": userAgent } : {}),
        },
      });
      const refreshed = await requestTokenPair(
        "/auth/refresh",
        { refreshToken },
        refreshRequest,
      );
      refreshedTokens = refreshed.tokens;
      if (refreshedTokens) backendResponse = await send(refreshedTokens.accessToken);
    }

    const responseHeaders = new Headers();
    const contentType = backendResponse.headers.get("content-type");
    if (contentType) responseHeaders.set("Content-Type", contentType);
    const contentDisposition = backendResponse.headers.get("content-disposition");
    if (contentDisposition)
      responseHeaders.set("Content-Disposition", contentDisposition);
    const response = new NextResponse(backendResponse.body, {
      status: backendResponse.status,
      headers: responseHeaders,
    });
    if (refreshedTokens) setAuthCookies(response, refreshedTokens);
    if (backendResponse.status === 401) clearAuthCookies(response);
    return response;
  } catch {
    return Response.json(
      {
        success: false,
        error: {
          code: "SERVICE_UNAVAILABLE",
          message: "Không thể kết nối dịch vụ backend.",
        },
      },
      { status: 503 },
    );
  }
}
