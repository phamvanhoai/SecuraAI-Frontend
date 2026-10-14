import { NextResponse } from "next/server";
import { sendInSystemNotificationInputSchema } from "@/features/notification-system-logs/schemas/send-in-system-notification-schema";
import { proxyAuthenticatedRequest } from "@/lib/api/backend-proxy";

export async function POST(request: Request): Promise<Response> {
  if (request.headers.get("origin") !== new URL(request.url).origin)
    return NextResponse.json(
      {
        success: false,
        error: { code: "FORBIDDEN", message: "Same-origin request required." },
      },
      { status: 403 },
    );

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      {
        success: false,
        error: { code: "VALIDATION_FAILED", message: "Invalid JSON." },
      },
      { status: 422 },
    );
  }
  const parsed = sendInSystemNotificationInputSchema.safeParse(body);
  if (!parsed.success)
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "VALIDATION_FAILED",
          message: "Check the notification content and recipients.",
        },
      },
      { status: 422 },
    );
  return proxyAuthenticatedRequest("/notifications", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(parsed.data),
    signal: request.signal,
  });
}
