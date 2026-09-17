import { proxyAuthenticatedRequest } from "@/lib/api/backend-proxy";
export function GET(request: Request) {
  return proxyAuthenticatedRequest(`/incidents${new URL(request.url).search}`);
}
export async function POST(request: Request) {
  return proxyAuthenticatedRequest("/incidents", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: await request.text(),
  });
}
