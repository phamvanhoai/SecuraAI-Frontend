import { proxyAuthenticatedRequest } from "@/lib/api/backend-proxy";

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> },
): Promise<Response> {
  const { id } = await context.params;
  const url = new URL(request.url);
  const search = url.search;
  return proxyAuthenticatedRequest(
    `/integrations/${encodeURIComponent(id)}/connection-status${search}`,
  );
}
