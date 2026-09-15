import { proxyAuthenticatedRequest } from "@/lib/api/backend-proxy";
export async function PATCH(
  request: Request,
  context: { params: Promise<{ logSourceId: string }> },
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
  context: { params: Promise<{ logSourceId: string }> },
): Promise<Response> {
  const { logSourceId } = await context.params;
  return proxyAuthenticatedRequest(
    `/security-monitoring/log-sources/${encodeURIComponent(logSourceId)}`,
    { method: "DELETE" },
  );
}
