import { proxyAuthenticatedRequest } from "@/lib/api/backend-proxy";

export function GET(request: Request): Promise<Response> {
  return proxyAuthenticatedRequest(`/ai-alerts/thresholds${new URL(request.url).search}`);
}

export async function PUT(request: Request): Promise<Response> {
  return proxyAuthenticatedRequest("/ai-alerts/thresholds", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: await request.text(),
  });
}
