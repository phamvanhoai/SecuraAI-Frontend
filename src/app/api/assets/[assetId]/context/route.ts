import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { z } from "zod";
import { linkAssetContextRequestSchema } from "@/features/it-asset-management/schemas/link-asset-context-schema";
import { authCookieNames, clearAuthCookies, setAuthCookies } from "@/lib/auth/auth-cookies";
import { requestTokenPair } from "@/lib/auth/backend-auth";
import { env } from "@/lib/env";
const paramsSchema = z.object({ assetId: z.uuid() });
const invalid = (message: string) => NextResponse.json({ success: false, error: { code: "VALIDATION_ERROR", message } }, { status: 422 });
export async function PUT(request: Request, context: { params: Promise<{ assetId: string }> }): Promise<Response> {
  const params = paramsSchema.safeParse(await context.params); if (!params.success) return invalid("Invalid asset ID");
  let body: unknown; try { body = await request.json(); } catch { return invalid("Invalid request body"); }
  const parsed = linkAssetContextRequestSchema.safeParse(body); if (!parsed.success) return invalid("Invalid asset context");
  const cookieStore = await cookies(); const accessToken = cookieStore.get(authCookieNames.access)?.value;
  if (!accessToken) return NextResponse.json({ success: false, error: { code: "UNAUTHORIZED", message: "Authentication required" } }, { status: 401 });
  const base = env.NEXT_PUBLIC_API_BASE_URL.endsWith("/") ? env.NEXT_PUBLIC_API_BASE_URL : `${env.NEXT_PUBLIC_API_BASE_URL}/`;
  const url = new URL(`assets/${params.data.assetId}/context`, base);
  const send = (token: string) => fetch(url, { method: "PUT", headers: { Accept: "application/json", Authorization: `Bearer ${token}`, "Content-Type": "application/json" }, body: JSON.stringify(parsed.data), cache: "no-store" });
  try { let backendResponse = await send(accessToken); let refreshedTokens; if (backendResponse.status === 401) { const refreshToken = cookieStore.get(authCookieNames.refresh)?.value; if (refreshToken) { const refreshed = await requestTokenPair("/auth/refresh", { refreshToken }, request); refreshedTokens = refreshed.tokens; if (refreshedTokens) backendResponse = await send(refreshedTokens.accessToken); } } const response = new NextResponse(await backendResponse.text(), { status: backendResponse.status, headers: { "content-type": backendResponse.headers.get("content-type") ?? "application/json" } }); if (refreshedTokens) setAuthCookies(response, refreshedTokens); if (backendResponse.status === 401) clearAuthCookies(response); return response; } catch { return NextResponse.json({ success: false, error: { code: "SERVICE_UNAVAILABLE", message: "Backend unavailable" } }, { status: 503 }); }
}
