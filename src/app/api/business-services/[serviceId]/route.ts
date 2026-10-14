import { NextResponse } from "next/server";
import { z } from "zod";
import { proxyAuthenticatedRequest } from "@/lib/api/backend-proxy";
import { updateBusinessServiceSchema } from "@/features/it-asset-management/schemas/update-business-service-schema";

export async function PATCH(
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
  const parsed = updateBusinessServiceSchema.safeParse(body);
  if (!id.success || !parsed.success)
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "VALIDATION_FAILED",
          message: "Invalid service update.",
        },
      },
      { status: 422 },
    );
  return proxyAuthenticatedRequest(`/business-services/${id.data}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(parsed.data),
    signal: request.signal,
  });
}

export async function GET(
  request: Request,
  context: { params: Promise<{ serviceId: string }> },
): Promise<Response> {
  const parsed = z.uuid().safeParse((await context.params).serviceId);
  if (!parsed.success)
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "VALIDATION_FAILED",
          message: "Invalid business service ID.",
        },
      },
      { status: 422 },
    );
  return proxyAuthenticatedRequest(`/business-services/${parsed.data}`, {
    signal: request.signal,
  });
}
