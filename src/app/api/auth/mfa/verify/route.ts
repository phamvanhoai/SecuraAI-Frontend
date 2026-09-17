import { NextResponse } from "next/server";
import { z } from "zod";
import { clearAuthCookies, setAuthCookies } from "@/lib/auth/auth-cookies";
import { authenticatedPost } from "@/lib/auth/authenticated-request";

export async function POST(request: Request): Promise<NextResponse> {
  const input = z
    .object({ code: z.string().regex(/^\d{6}$/) })
    .safeParse(await request.json().catch(() => undefined));
  if (!input.success)
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "VALIDATION_FAILED",
          message: "Enter a valid 6-digit authentication code.",
        },
      },
      { status: 422 },
    );
  try {
    const result = await authenticatedPost(
      "/auth/mfa/verify",
      input.data,
      request,
    );
    const response = new NextResponse(await result.response.text(), {
      status: result.response.status,
      headers: {
        "Content-Type":
          result.response.headers.get("content-type") ?? "application/json",
        "Cache-Control": "no-store",
      },
    });
    if (result.refreshedTokens)
      setAuthCookies(response, result.refreshedTokens);
    if (result.response.status === 401) clearAuthCookies(response);
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
