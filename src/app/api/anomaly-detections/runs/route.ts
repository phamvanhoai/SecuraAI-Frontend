import { proxyAuthenticatedRequest } from "@/lib/api/backend-proxy";

export async function POST(request: Request): Promise<Response> {
  return proxyAuthenticatedRequest("/anomaly-detections/runs", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: await request.text(),
  });
}
