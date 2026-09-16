import { proxyAuthenticatedRequest } from "@/lib/api/backend-proxy";

export async function GET(
  request: Request,
  context: { params: Promise<{ campaignId: string }> },
): Promise<Response> {
  const { campaignId } = await context.params;
  return proxyAuthenticatedRequest(
    `/training/completion/${encodeURIComponent(campaignId)}${new URL(request.url).search}`,
  );
}
