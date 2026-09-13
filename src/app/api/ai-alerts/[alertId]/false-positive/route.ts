import { proxyAuthenticatedRequest } from "@/lib/api/backend-proxy";

export async function POST(
  request: Request,
  context: { params: Promise<{ alertId: string }> },
): Promise<Response> {
  const { alertId } = await context.params;
  return proxyAuthenticatedRequest(
    `/ai-alerts/${encodeURIComponent(alertId)}/false-positive`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: await request.text(),
    },
  );
}
