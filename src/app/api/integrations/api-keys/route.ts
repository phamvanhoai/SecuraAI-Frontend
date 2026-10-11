import { proxyAuthenticatedRequest } from "@/lib/api/backend-proxy";

export async function GET(request: Request): Promise<Response> {
  const url = new URL(request.url);
  const search = url.search;
  return proxyAuthenticatedRequest(`/integrations/api-keys${search}`);
}

export async function POST(request: Request): Promise<Response> {
  return proxyAuthenticatedRequest("/integrations/api-keys", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: await request.text(),
  });
}
