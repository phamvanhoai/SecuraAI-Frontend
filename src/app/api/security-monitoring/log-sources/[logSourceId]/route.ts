import { proxyAuthenticatedRequest } from "@/lib/api/backend-proxy";
export async function PATCH(
  request: Request,
  context: RouteContext<"/api/security-monitoring/log-sources/[logSourceId]">,
): Promise<Response> {
  const { logSourceId } = await context.params;
  return proxyAuthenticatedRequest(
    `/security-monitoring/log-sources/${encodeURIComponent(logSourceId)}`,
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: await request.text(),
    },
  );
}

export async function DELETE(
  _request: Request,
  context: RouteContext<"/api/security-monitoring/log-sources/[logSourceId]">,
): Promise<Response> {
  const { logSourceId } = await context.params;
  return proxyAuthenticatedRequest(
    `/security-monitoring/log-sources/${encodeURIComponent(logSourceId)}`,
    { method: "DELETE" },
  );
}
