import { NextResponse } from "next/server";
import { z } from "zod";
import { proxyAuthenticatedRequest } from "@/lib/api/backend-proxy";

export async function GET(
  request: Request,
  context: { params: Promise<{ serviceId: string }> },
): Promise<Response> {
  const id = z.uuid().safeParse((await context.params).serviceId);
  if (!id.success)
    return NextResponse.json(
      {
        success: false,
        error: { code: "VALIDATION_FAILED", message: "Invalid service ID." },
      },
      { status: 422 },
    );
  return proxyAuthenticatedRequest(
    `/business-services/${id.data}/deactivation-check`,
    { signal: request.signal },
  );
}
