import { NextResponse } from "next/server";
import { z } from "zod";
import { proxyAuthenticatedRequest } from "@/lib/api/backend-proxy";
import { deactivateBusinessServiceSchema } from "@/features/it-asset-management/schemas/deactivate-business-service-schema";

export async function POST(
  request: Request,
  context: { params: Promise<{ serviceId: string }> },
): Promise<Response> {
  if (request.headers.get("origin") !== new URL(request.url).origin)
    return NextResponse.json(
      {
        success: false,
        error: { code: "FORBIDDEN", message: "Same-origin request required." },
      },
      { status: 403 },
    );
  const id = z.uuid().safeParse((await context.params).serviceId);
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
  const parsed = deactivateBusinessServiceSchema.safeParse(body);
  if (!id.success || !parsed.success)
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "VALIDATION_FAILED",
          message:
            "Enter the service name and reason. Reload if the service changed.",
        },
      },
      { status: 422 },
    );
  return proxyAuthenticatedRequest(`/business-services/${id.data}/deactivate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(parsed.data),
    signal: request.signal,
  });
}
