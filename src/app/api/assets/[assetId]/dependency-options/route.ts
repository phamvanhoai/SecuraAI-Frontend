import { z } from "zod";
import { proxyAuthenticatedRequest } from "@/lib/api/backend-proxy";
import { assetDependencyOptionsQuerySchema } from "@/features/it-asset-management/schemas/asset-dependency-options-schema";
export async function GET(request: Request, context: { params: Promise<{ assetId: string }> }): Promise<Response> {
  const params = z.object({ assetId: z.uuid() }).safeParse(await context.params);
  const query = assetDependencyOptionsQuerySchema.safeParse(Object.fromEntries(new URL(request.url).searchParams));
  if (!params.success || !query.success) return Response.json({ success: false, error: { code: "VALIDATION_ERROR", message: "Invalid dependency search." } }, { status: 422 });
  const response = await proxyAuthenticatedRequest(`/assets/${params.data.assetId}/dependency-options?${new URLSearchParams({ q: query.data.q })}`, { signal: request.signal });
  response.headers.set("Cache-Control", "private, no-store");
  return response;
}
