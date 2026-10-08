import { NextResponse } from "next/server";
import { updateNotificationPreferencesInputSchema } from "@/features/notification-system-logs/schemas/notification-preferences-schema";
import { proxyAuthenticatedRequest } from "@/lib/api/backend-proxy";

export async function GET(request: Request): Promise<Response> {
  return proxyAuthenticatedRequest("/notifications/preferences", {
    signal: request.signal,
  });
}

export async function PATCH(request: Request): Promise<Response> {
  if (request.headers.get("origin") !== new URL(request.url).origin)
    return NextResponse.json(
      { success: false, error: { code: "FORBIDDEN", message: "Same-origin request required." } },
      { status: 403 },
    );
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { success: false, error: { code: "VALIDATION_FAILED", message: "Invalid JSON." } },
      { status: 422 },
    );
  }
  const parsed = updateNotificationPreferencesInputSchema.safeParse(body);
  if (!parsed.success)
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "VALIDATION_FAILED",
          message: "Keep at least one supported notification channel enabled.",
        },
      },
      { status: 422 },
    );
  return proxyAuthenticatedRequest("/notifications/preferences", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(parsed.data),
    signal: request.signal,
  });
}
