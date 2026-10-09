import { proxyAuthenticatedRequest } from "@/lib/api/backend-proxy";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(_request: Request, context: RouteContext): Promise<Response> {
  const { id } = await context.params;
  return proxyAuthenticatedRequest(`/event-governance/policies/${encodeURIComponent(id)}`, {
    method: "GET",
  });
}
