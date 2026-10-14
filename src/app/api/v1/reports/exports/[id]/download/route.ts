import { proxyAuthenticatedRequest } from "@/lib/api/backend-proxy";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
): Promise<Response> {
  const { id } = await context.params;
  return proxyAuthenticatedRequest(`/reports/exports/${id}/download`, {
    method: "GET",
  });
}
