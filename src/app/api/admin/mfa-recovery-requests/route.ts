import { NextResponse } from "next/server";
import { authenticatedRequest } from "@/lib/auth/authenticated-request";
import { clearAuthCookies, setAuthCookies } from "@/lib/auth/auth-cookies";

export async function GET(request: Request): Promise<NextResponse> {
  const search = new URL(request.url).search;
  const result = await authenticatedRequest(
    `/admin/mfa-recovery-requests${search}`,
    { method: "GET" },
    request,
  );
  const response = new NextResponse(await result.response.text(), {
    status: result.response.status,
    headers: {
      "content-type":
        result.response.headers.get("content-type") ?? "application/json",
    },
  });
  if (result.refreshedTokens) setAuthCookies(response, result.refreshedTokens);
  if (result.response.status === 401) clearAuthCookies(response);
  return response;
}
