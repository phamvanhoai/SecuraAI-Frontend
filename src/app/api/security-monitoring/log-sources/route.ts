import { proxyAuthenticatedRequest } from "@/lib/api/backend-proxy";

export function GET(request: Request): Promise<Response> {
  const query = new URL(request.url).search;
  return proxyAuthenticatedRequest(`/security-monitoring/log-sources${query}`);
}
export async function POST(request: Request): Promise<Response> {
  return proxyAuthenticatedRequest("/security-monitoring/log-sources", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: await request.text(),
  });
}
