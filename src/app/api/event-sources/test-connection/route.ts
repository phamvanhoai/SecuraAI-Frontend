import { proxyAuthenticatedRequest } from "@/lib/api/backend-proxy";

export async function POST(request: Request): Promise<Response> {
  return proxyAuthenticatedRequest("/event-sources/test-connection", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: await request.text(),
  });
}
