import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { z } from "zod";
import { assetHistoryQuerySchema } from "@/features/assets";
import { authCookieNames, clearAuthCookies, setAuthCookies } from "@/lib/auth/auth-cookies";
import { requestTokenPair } from "@/lib/auth/backend-auth";
import { env } from "@/lib/env";

const paramsSchema = z.object({ assetId: z.uuid() });

export async function GET(request: Request, context: { params: Promise<{ assetId: string }> }): Promise<Response> {
  const params = paramsSchema.safeParse(await context.params);
  const query = assetHistoryQuerySchema.safeParse(Object.fromEntries(new URL(request.url).searchParams.entries()));
  if (!params.success || !query.success) return error(422, "VALIDATION_ERROR", "Invalid history request");
  const cookieStore = await cookies();
  const accessToken = cookieStore.get(authCookieNames.access)?.value;
  if (!accessToken) return error(401, "UNAUTHORIZED", "Authentication required");
  const url = new URL(`assets/${params.data.assetId}/history`, `${env.NEXT_PUBLIC_API_BASE_URL.replace(/\/$/, "")}/`);
  Object.entries(query.data).forEach(([key, value]) => url.searchParams.set(key, String(value)));
  const send = (token: string) => fetch(url, { headers: { Accept: "application/json", Authorization: `Bearer ${token}` }, cache: "no-store" });
  try {
    let backendResponse = await send(accessToken);
    let refreshedTokens;
    if (backendResponse.status === 401) {
      const refreshToken = cookieStore.get(authCookieNames.refresh)?.value;
      if (refreshToken) {
        const refreshed = await requestTokenPair("/auth/refresh", { refreshToken }, request);
        refreshedTokens = refreshed.tokens;
        if (refreshedTokens) backendResponse = await send(refreshedTokens.accessToken);
      }
    }
    const response = new NextResponse(await backendResponse.text(), { status: backendResponse.status, headers: { "content-type": backendResponse.headers.get("content-type") ?? "application/json" } });
    if (refreshedTokens) setAuthCookies(response, refreshedTokens);
    if (backendResponse.status === 401) clearAuthCookies(response);
    return response;
  } catch {
    return error(503, "SERVICE_UNAVAILABLE", "Backend unavailable");
  }
}

function error(status: number, code: string, message: string): Response {
  return NextResponse.json({ success: false, error: { code, message } }, { status });
}
