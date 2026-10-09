import { proxyAuthenticatedRequest } from "@/lib/api/backend-proxy";

type RouteParams = {
  params: Promise<{ id: string }>;
};

export async function GET(
  _request: Request,
  context: RouteParams,
): Promise<Response> {
  const { id } = await context.params;
  return proxyAuthenticatedRequest(`/audit-logs/${encodeURIComponent(id)}/diff`, {
    method: "GET",
  });
}
