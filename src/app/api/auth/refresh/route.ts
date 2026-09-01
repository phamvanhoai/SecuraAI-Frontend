import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { authCookieNames, clearAuthCookies, setAuthCookies } from "@/lib/auth/auth-cookies";
import { requestTokenPair } from "@/lib/auth/backend-auth";

export async function POST(request: Request): Promise<NextResponse> {
  const cookieStore = await cookies();
  const refreshToken = cookieStore.get(authCookieNames.refresh)?.value;
  if (!refreshToken) return NextResponse.json({ success: false }, { status: 401 });

  try {
    const result = await requestTokenPair("/auth/refresh", { refreshToken }, request);
    if (!result.tokens) {
      const response = NextResponse.json({ success: false }, { status: 401 });
      clearAuthCookies(response);
      return response;
    }
    const response = NextResponse.json({ success: true, data: { refreshed: true } });
    setAuthCookies(response, result.tokens);
    return response;
  } catch {
    return NextResponse.json({ success: false }, { status: 503 });
  }
}
