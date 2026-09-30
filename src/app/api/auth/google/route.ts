import { NextResponse } from "next/server";
import { z } from "zod";
import { setAuthCookies } from "@/lib/auth/auth-cookies";
import { publicAuthError, requestTokenPair } from "@/lib/auth/backend-auth";

const bodySchema = z.object({ credential: z.string().trim().min(1).max(4096) });

export async function POST(request: Request): Promise<NextResponse> {
  const input = bodySchema.safeParse(await request.json().catch(() => undefined));
  if (!input.success) {
    return NextResponse.json(
      { success: false, error: { code: "VALIDATION_FAILED", message: "Invalid Google credential." } },
      { status: 422 },
    );
  }
  try {
    const result = await requestTokenPair("/auth/google", input.data, request);
    if (!result.tokens) {
      return NextResponse.json(
        { success: false, error: publicAuthError(result.response.status) },
        { status: result.response.status },
      );
    }
    const response = NextResponse.json({ success: true, data: { authenticated: true } });
    setAuthCookies(response, result.tokens);
    return response;
  } catch {
    return NextResponse.json(
      { success: false, error: { code: "AUTH_SERVICE_UNAVAILABLE", message: "Unable to connect to Google sign-in." } },
      { status: 503 },
    );
  }
}
