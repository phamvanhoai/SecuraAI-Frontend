import { proxyAuthenticatedRequest } from "@/lib/api/backend-proxy";

export async function POST(
  _request: Request,
  context: { params: Promise<{ alertId: string }> },
): Promise<Response> {
  const { alertId } = await context.params;
  return proxyAuthenticatedRequest(
    `/ai-alerts/${encodeURIComponent(alertId)}/triage/start`,
    { method: "POST" },
  );
}
