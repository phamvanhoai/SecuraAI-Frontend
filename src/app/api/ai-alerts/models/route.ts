import { proxyAuthenticatedRequest } from "@/lib/api/backend-proxy";
export function GET(request: Request): Promise<Response> {
  return proxyAuthenticatedRequest(
    `/ai-alerts/models${new URL(request.url).search}`,
  );
}
export async function POST(request: Request): Promise<Response> {
  return proxyAuthenticatedRequest("/ai-alerts/models", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: await request.text(),
  });
}
