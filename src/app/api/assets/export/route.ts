import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { assetListQuerySchema } from "@/features/assets";
import {
  authCookieNames,
  clearAuthCookies,
  setAuthCookies,
} from "@/lib/auth/auth-cookies";
import { requestTokenPair } from "@/lib/auth/backend-auth";
import { env } from "@/lib/env";

export async function GET(request: Request): Promise<Response> {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get(authCookieNames.access)?.value;
  if (!accessToken) return unauthorized();
  const parsed = assetListQuerySchema.safeParse(
    Object.fromEntries(new URL(request.url).searchParams.entries()),
  );
  if (!parsed.success) return validationError();
  const url = new URL("assets/export", `${env.NEXT_PUBLIC_API_BASE_URL.replace(/\/$/, "")}/`);
  Object.entries(parsed.data).forEach(([key, value]) => {
    if (key !== "page" && key !== "limit" && value !== undefined)
      url.searchParams.set(key, String(value));
  });
  const send = (token: string) => fetch(url, {
    headers: { Accept: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", Authorization: `Bearer ${token}` },
    cache: "no-store",
  });
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
    const headers = new Headers();
    for (const name of ["content-type", "content-disposition", "x-exported-rows"]) {
      const value = backendResponse.headers.get(name);
      if (value) headers.set(name, value);
    }
    const response = new NextResponse(backendResponse.body, { status: backendResponse.status, headers });
    if (refreshedTokens) setAuthCookies(response, refreshedTokens);
    if (backendResponse.status === 401) clearAuthCookies(response);
    return response;
  } catch {
    return NextResponse.json({ success: false, error: { code: "SERVICE_UNAVAILABLE", message: "Backend unavailable" } }, { status: 503 });
  }
}

function unauthorized(): Response {
  return NextResponse.json({ success: false, error: { code: "UNAUTHORIZED", message: "Authentication required" } }, { status: 401 });
}
function validationError(): Response {
  return NextResponse.json({ success: false, error: { code: "VALIDATION_ERROR", message: "Invalid asset filters" } }, { status: 422 });
}
