import "server-only";

import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { authCookieNames, setAuthCookies } from "@/lib/auth/auth-cookies";
import { env } from "@/lib/env";

function backendUrl(path: string): string {
  return `${env.NEXT_PUBLIC_API_BASE_URL.replace(/\/$/, "")}${path}`;
}

async function tryRefreshTokens(
  refreshToken: string,
): Promise<{ accessToken: string; refreshToken: string } | null> {
  try {
    const res = await fetch(backendUrl("/auth/refresh"), {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ refreshToken }),
      cache: "no-store",
    });
    if (!res.ok) return null;
    const data = (await res.json()) as {
      success?: boolean;
      data?: { accessToken: string; refreshToken: string };
    };
    if (data?.success && data?.data?.accessToken && data?.data?.refreshToken) {
      return data.data;
    }
    return null;
  } catch {
    return null;
  }
}

export async function proxyAuthenticatedRequest(
  path: string,
  init: RequestInit = {},
): Promise<Response> {
  const cookieStore = await cookies();
  let accessToken = cookieStore.get(authCookieNames.access)?.value;
  const refreshToken = cookieStore.get(authCookieNames.refresh)?.value;
  let newTokens: { accessToken: string; refreshToken: string } | null = null;

  if (!accessToken && refreshToken) {
    newTokens = await tryRefreshTokens(refreshToken);
    if (newTokens) {
      accessToken = newTokens.accessToken;
    }
  }

  if (!accessToken) {
    return Response.json(
      {
        success: false,
        error: { code: "UNAUTHENTICATED", message: "Authentication required" },
      },
      { status: 401 },
    );
  }

  try {
    let response = await fetch(backendUrl(path), {
      ...init,
      cache: "no-store",
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${accessToken}`,
        ...init.headers,
      },
    });

    if (response.status === 401 && refreshToken && !newTokens) {
      newTokens = await tryRefreshTokens(refreshToken);
      if (newTokens) {
        response = await fetch(backendUrl(path), {
          ...init,
          cache: "no-store",
          headers: {
            Accept: "application/json",
            Authorization: `Bearer ${newTokens.accessToken}`,
            ...init.headers,
          },
        });
      }
    }

    const headers = new Headers();
    const contentType = response.headers.get("content-type");
    if (contentType) headers.set("Content-Type", contentType);
    const contentDisposition = response.headers.get("content-disposition");
    if (contentDisposition) headers.set("Content-Disposition", contentDisposition);

    const nextResponse = new NextResponse(response.body, {
      status: response.status,
      headers,
    });

    if (newTokens) {
      setAuthCookies(nextResponse, newTokens);
    }

    return nextResponse;
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
