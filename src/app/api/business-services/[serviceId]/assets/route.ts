import { NextResponse } from "next/server";
import { z } from "zod";
import { businessServicePageQuerySchema } from "@/features/it-asset-management/schemas/business-service-schema";
import { proxyAuthenticatedRequest } from "@/lib/api/backend-proxy";

export async function GET(
  request: Request,
  context: { params: Promise<{ serviceId: string }> },
): Promise<Response> {
  const id = z.uuid().safeParse((await context.params).serviceId);
  const query = businessServicePageQuerySchema.safeParse(
    Object.fromEntries(new URL(request.url).searchParams),
  );
  if (!id.success || !query.success)
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "VALIDATION_FAILED",
          message: "Invalid linked asset request.",
        },
      },
      { status: 422 },
    );
  return proxyAuthenticatedRequest(
    `/business-services/${id.data}/assets?page=${query.data.page}&limit=${query.data.limit}`,
    { signal: request.signal },
  );
}
