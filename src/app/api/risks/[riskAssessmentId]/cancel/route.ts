import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { z } from "zod";
import { cancelRiskAssessmentRequestSchema } from "@/features/risk-assessment";
import {
  authCookieNames,
  clearAuthCookies,
  setAuthCookies,
} from "@/lib/auth/auth-cookies";
import { requestTokenPair } from "@/lib/auth/backend-auth";
import { env } from "@/lib/env";

const paramsSchema = z.object({ riskAssessmentId: z.uuid() });

export async function POST(
  request: Request,
  context: { params: Promise<{ riskAssessmentId: string }> },
): Promise<Response> {
  const parsedParams = paramsSchema.safeParse(await context.params);
  if (!parsedParams.success)
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid risk assessment ID",
        },
      },
      { status: 422 },
    );
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
  const parsedBody = cancelRiskAssessmentRequestSchema.safeParse(body);
  if (!parsedBody.success)
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid cancellation data",
        },
      },
      { status: 422 },
    );
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
  const url = new URL(
    `risks/${parsedParams.data.riskAssessmentId}/cancel`,
    base,
  );
  const send = (token: string) =>
    fetch(url, {
      method: "POST",
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(parsedBody.data),
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
