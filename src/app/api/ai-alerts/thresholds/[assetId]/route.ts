import { proxyAuthenticatedRequest } from "@/lib/api/backend-proxy";

export async function PUT(
  request: Request,
  context: { params: Promise<{ assetId: string }> },
): Promise<Response> {
  const { assetId } = await context.params;
  return proxyAuthenticatedRequest(`/ai-alerts/thresholds/${encodeURIComponent(assetId)}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: await request.text(),
  });
}
