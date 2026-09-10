import "server-only";

import { cookies } from "next/headers";
import { authCookieNames } from "@/lib/auth/auth-cookies";
import { env } from "@/lib/env";

function backendUrl(path: string): string {
  return `${env.NEXT_PUBLIC_API_BASE_URL.replace(/\/$/, "")}${path}`;
}

export async function proxyAuthenticatedRequest(
  path: string,
  init: RequestInit = {},
): Promise<Response> {
  const accessToken = (await cookies()).get(authCookieNames.access)?.value;
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
    const response = await fetch(backendUrl(path), {
      ...init,
      cache: "no-store",
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${accessToken}`,
        ...init.headers,
      },
    });
    const headers = new Headers();
    const contentType = response.headers.get("content-type");
    if (contentType) headers.set("Content-Type", contentType);
    return new Response(response.body, {
      status: response.status,
      headers,
    });
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
