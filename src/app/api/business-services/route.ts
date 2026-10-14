import { NextResponse } from "next/server";
import { businessServiceListQuerySchema } from "@/features/it-asset-management/schemas/business-service-schema";
import { proxyAuthenticatedRequest } from "@/lib/api/backend-proxy";
import { createBusinessServiceSchema } from "@/features/it-asset-management/schemas/create-business-service-schema";

export async function POST(request: Request): Promise<Response> {
  // HttpOnly cookies authenticate this BFF: reject cross-origin writes before
  // forwarding a cookie-backed request as a backend Bearer request.
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
  const parsed = createBusinessServiceSchema.safeParse(body);
  if (!parsed.success)
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "VALIDATION_FAILED",
          message: "Check the service fields.",
        },
      },
      { status: 422 },
    );
  return proxyAuthenticatedRequest("/business-services", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(parsed.data),
    signal: request.signal,
  });
}

export async function GET(request: Request): Promise<Response> {
  const parsed = businessServiceListQuerySchema.safeParse(
    Object.fromEntries(new URL(request.url).searchParams),
  );
  if (!parsed.success)
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "VALIDATION_FAILED",
          message: "Invalid business service filters.",
        },
      },
      { status: 422 },
    );
  const parameters = new URLSearchParams();
  Object.entries(parsed.data).forEach(([key, value]) => {
    if (value !== undefined) parameters.set(key, String(value));
  });
  return proxyAuthenticatedRequest(`/business-services?${parameters}`, {
    signal: request.signal,
  });
}
