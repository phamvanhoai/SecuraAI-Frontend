import { proxyAuthenticatedRequest } from "@/lib/api/backend-proxy";

export async function GET(
  request: Request,
  context: { params: Promise<{ logId: string }> },
): Promise<Response> {
  const { logId } = await context.params;
  return proxyAuthenticatedRequest(`/audit-logs/${encodeURIComponent(logId)}`, {
    signal: request.signal,
  });
}
