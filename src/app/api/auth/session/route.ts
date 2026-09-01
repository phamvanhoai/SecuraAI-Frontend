import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { authCookieNames, clearAuthCookies, setAuthCookies } from "@/lib/auth/auth-cookies";
import { requestCurrentUser, requestTokenPair } from "@/lib/auth/backend-auth";

export async function GET(request: Request): Promise<NextResponse> {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get(authCookieNames.access)?.value;
  if (accessToken) {
    const user = await requestCurrentUser(accessToken).catch(() => null);
    if (user) return NextResponse.json({ success: true, data: { user } });
  }

  const refreshToken = cookieStore.get(authCookieNames.refresh)?.value;
  if (!refreshToken) return NextResponse.json({ success: false }, { status: 401 });

  try {
    const refreshed = await requestTokenPair("/auth/refresh", { refreshToken }, request);
    if (!refreshed.tokens) {
      const response = NextResponse.json({ success: false }, { status: 401 });
      clearAuthCookies(response);
      return response;
    }
    const user = await requestCurrentUser(refreshed.tokens.accessToken);
    if (!user) return NextResponse.json({ success: false }, { status: 401 });
    const response = NextResponse.json({ success: true, data: { user } });
    setAuthCookies(response, refreshed.tokens);
    return response;
  } catch {
    return NextResponse.json({ success: false }, { status: 503 });
  }
}
