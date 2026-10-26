import { z } from "zod";
import { assetContextHistoryQuerySchema } from "@/features/it-asset-management/schemas/asset-context-history-schema";
import { proxyAuthenticatedRequest } from "@/lib/api/backend-proxy";

export async function GET(
  request: Request,
  context: { params: Promise<{ assetId: string }> },
): Promise<Response> {
  const params = z
    .object({ assetId: z.uuid() })
    .safeParse(await context.params);
  const query = assetContextHistoryQuerySchema.safeParse(
    Object.fromEntries(new URL(request.url).searchParams),
  );
  if (!params.success || !query.success)
    return Response.json(
      {
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid asset ID or history pagination",
        },
      },
      { status: 422 },
    );
  const search = new URLSearchParams({
    page: String(query.data.page),
    limit: String(query.data.limit),
  });
  const response = await proxyAuthenticatedRequest(
    `/assets/${params.data.assetId}/context/history?${search}`,
  );
  response.headers.set("Cache-Control", "private, no-store");
  return response;
}
