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

export async function PATCH(request: Request, context: RouteContext): Promise<Response> {
  const { id } = await context.params;
  const body = (await request.json()) as Record<string, unknown>;
  return proxyAuthenticatedRequest(`/event-governance/policies/${encodeURIComponent(id)}`, {
    method: "PATCH",
    body: JSON.stringify(body),
    headers: {
      "Content-Type": "application/json",
    },
  });
}
