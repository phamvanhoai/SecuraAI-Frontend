import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import {
  authCookieNames,
  clearAuthCookies,
  setAuthCookies,
} from "@/lib/auth/auth-cookies";
import { requestTokenPair } from "@/lib/auth/backend-auth";
import { env } from "@/lib/env";

export async function POST(request: Request): Promise<Response> {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get(authCookieNames.access)?.value;
  if (!accessToken) {
    return NextResponse.json(
      { success: false, error: { code: "UNAUTHORIZED", message: "Authentication required" } },
      { status: 401 },
    );
  }
  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json(
      { success: false, error: { code: "VALIDATION_ERROR", message: "Invalid Excel upload" } },
      { status: 422 },
    );
  }
  const file = formData.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json(
      { success: false, error: { code: "VALIDATION_ERROR", message: "An Excel file is required" } },
      { status: 422 },
    );
  }
  const backendForm = new FormData();
  backendForm.set("file", file, file.name);
  const url = `${env.NEXT_PUBLIC_API_BASE_URL.replace(/\/$/, "")}/assets/import`;
  const send = (token: string) =>
    fetch(url, {
      method: "POST",
      headers: { Accept: "application/json", Authorization: `Bearer ${token}` },
      body: backendForm,
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
    const response = new NextResponse(await backendResponse.text(), {
      status: backendResponse.status,
      headers: { "content-type": backendResponse.headers.get("content-type") ?? "application/json" },
    });
    if (refreshedTokens) setAuthCookies(response, refreshedTokens);
    if (backendResponse.status === 401) clearAuthCookies(response);
    return response;
  } catch {
    return NextResponse.json(
      { success: false, error: { code: "SERVICE_UNAVAILABLE", message: "Backend unavailable" } },
      { status: 503 },
    );
  }
}
