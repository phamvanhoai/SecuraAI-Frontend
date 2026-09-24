import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import {
  createRiskAssessmentRequestSchema,
  riskListQuerySchema,
} from "@/features/risk-assessment";
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
  if (!accessToken)
    return NextResponse.json(
      {
        success: false,
        error: { code: "UNAUTHORIZED", message: "Authentication required" },
      },
      { status: 401 },
    );
  const parsed = riskListQuerySchema.safeParse(
    Object.fromEntries(new URL(request.url).searchParams.entries()),
  );
  if (!parsed.success)
    return NextResponse.json(
      {
        success: false,
        error: { code: "VALIDATION_ERROR", message: "Invalid risk filters" },
      },
      { status: 422 },
    );
  const base = env.NEXT_PUBLIC_API_BASE_URL.endsWith("/")
    ? env.NEXT_PUBLIC_API_BASE_URL
    : `${env.NEXT_PUBLIC_API_BASE_URL}/`;
  const url = new URL("risks", base);
  Object.entries(parsed.data).forEach(([key, value]) =>
    url.searchParams.set(key, String(value)),
  );
  const send = (token: string) =>
    fetch(url, {
      headers: { Accept: "application/json", Authorization: `Bearer ${token}` },
      cache: "no-store",
    });
  try {
    let backendResponse = await send(accessToken);
    let refreshedTokens;
    if (backendResponse.status === 401) {
      const refreshToken = cookieStore.get(authCookieNames.refresh)?.value;
      if (refreshToken) {
        const refreshed = await requestTokenPair(
          "/auth/refresh",
          { refreshToken },
          request,
        );
        refreshedTokens = refreshed.tokens;
        if (refreshedTokens)
          backendResponse = await send(refreshedTokens.accessToken);
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

export async function POST(request: Request): Promise<Response> {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      {
        success: false,
        error: { code: "VALIDATION_ERROR", message: "Invalid request body" },
      },
      { status: 422 },
    );
  }
  const parsed = createRiskAssessmentRequestSchema.safeParse(body);
  if (!parsed.success)
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid risk assessment data",
        },
      },
      { status: 422 },
    );
  const cleanBody = parsed.data;
  const cookieStore = await cookies();
  const accessToken = cookieStore.get(authCookieNames.access)?.value;
  if (!accessToken)
    return NextResponse.json(
      {
        success: false,
        error: { code: "UNAUTHORIZED", message: "Authentication required" },
      },
      { status: 401 },
    );
  const base = env.NEXT_PUBLIC_API_BASE_URL.endsWith("/")
    ? env.NEXT_PUBLIC_API_BASE_URL
    : `${env.NEXT_PUBLIC_API_BASE_URL}/`;
  const url = new URL("risks", base);
  const send = (token: string) =>
    fetch(url, {
      method: "POST",
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(cleanBody),
      cache: "no-store",
    });
  try {
    let backendResponse = await send(accessToken);
    let refreshedTokens;
    if (backendResponse.status === 401) {
      const refreshToken = cookieStore.get(authCookieNames.refresh)?.value;
      if (refreshToken) {
        const refreshed = await requestTokenPair(
          "/auth/refresh",
          { refreshToken },
          request,
        );
        refreshedTokens = refreshed.tokens;
        if (refreshedTokens)
          backendResponse = await send(refreshedTokens.accessToken);
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
