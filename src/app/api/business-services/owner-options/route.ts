import { NextResponse } from "next/server";
import { businessServiceOwnerQuerySchema } from "@/features/it-asset-management/schemas/create-business-service-schema";
import { proxyAuthenticatedRequest } from "@/lib/api/backend-proxy";
export async function GET(request: Request): Promise<Response> {
  const parsed = businessServiceOwnerQuerySchema.safeParse(
    Object.fromEntries(new URL(request.url).searchParams),
  );
  if (!parsed.success)
    return NextResponse.json(
      {
        success: false,
        error: { code: "VALIDATION_FAILED", message: "Invalid owner search." },
      },
      { status: 422 },
    );
  const parameters = new URLSearchParams();
  if (parsed.data.q) parameters.set("q", parsed.data.q);
  return proxyAuthenticatedRequest(
    `/business-services/owner-options${parameters.size ? `?${parameters}` : ""}`,
    { signal: request.signal },
  );
}
