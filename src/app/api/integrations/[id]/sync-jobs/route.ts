import { proxyAuthenticatedRequest } from "@/lib/api/backend-proxy";

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> },
): Promise<Response> {
  const { id } = await context.params;
  const query = new URL(request.url).search;
  return proxyAuthenticatedRequest(
    `/integrations/${encodeURIComponent(id)}/sync-jobs${query}`,
  );
}
