import { NextResponse } from "next/server";
import { loginHistoryQuerySchema } from "@/features/login-history/schemas/login-history-schema";
import { authenticatedRequest } from "@/lib/auth/authenticated-request";
import { clearAuthCookies, setAuthCookies } from "@/lib/auth/auth-cookies";

export async function GET(request: Request): Promise<NextResponse> {
  const parameters = new URL(request.url).searchParams;
  const input: Record<string, string> = {};
  for (const [key, value] of parameters) {
    if (key in input)
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: "Invalid query parameters.",
          },
        },
        { status: 422 },
      );
    input[key] = value;
  }
  const parsed = loginHistoryQuerySchema.safeParse(input);
  if (!parsed.success)
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid query parameters.",
        },
      },
      { status: 422 },
    );
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(parsed.data))
    if (value !== undefined) search.set(key, String(value));
  try {
    const result = await authenticatedRequest(
      `/login-history?${search}`,
      { method: "GET", signal: request.signal },
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
          message: "Unable to load login history.",
        },
      },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }
}
