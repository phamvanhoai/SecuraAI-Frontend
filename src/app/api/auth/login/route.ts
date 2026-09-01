import { NextResponse } from "next/server";
import { loginSchema } from "@/features/auth";
import { setAuthCookies } from "@/lib/auth/auth-cookies";
import { publicAuthError, requestTokenPair } from "@/lib/auth/backend-auth";

export async function POST(request: Request): Promise<NextResponse> {
  const input = loginSchema.safeParse(await request.json().catch(() => undefined));
  if (!input.success) {
    return NextResponse.json(
      { success: false, error: { code: "VALIDATION_FAILED", message: "Thông tin đăng nhập không hợp lệ." } },
      { status: 422 },
    );
  }

  try {
    const result = await requestTokenPair("/auth/login", input.data, request);
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
      { success: false, error: { code: "AUTH_SERVICE_UNAVAILABLE", message: "Không thể kết nối dịch vụ đăng nhập." } },
      { status: 503 },
    );
  }
}
