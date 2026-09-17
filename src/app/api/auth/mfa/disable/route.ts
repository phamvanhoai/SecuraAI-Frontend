import { NextResponse } from "next/server";
import { clearAuthCookies } from "@/lib/auth/auth-cookies";
import { authenticatedPost } from "@/lib/auth/authenticated-request";

export async function POST(request: Request): Promise<NextResponse> {
  const body: unknown = await request.json().catch(() => undefined);
  try {
    const result = await authenticatedPost("/auth/mfa/disable", body, request);
    const response = new NextResponse(await result.response.text(), {
      status: result.response.status,
      headers: {
        "Content-Type":
          result.response.headers.get("content-type") ?? "application/json",
        "Cache-Control": "no-store",
      },
    });
    if (result.response.ok || result.response.status === 401)
      clearAuthCookies(response);
    return response;
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
