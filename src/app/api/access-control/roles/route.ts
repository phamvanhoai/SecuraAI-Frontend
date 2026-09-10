import { proxyAuthenticatedRequest } from "@/lib/api/backend-proxy";

export async function GET(request: Request): Promise<Response> {
  const query = new URL(request.url).search;
  return proxyAuthenticatedRequest(`/access-control/roles${query}`);
}

export async function POST(request: Request): Promise<Response> {
  return proxyAuthenticatedRequest("/access-control/roles", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: await request.text(),
  });
}
