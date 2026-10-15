import { proxyAuthenticatedRequest } from "@/lib/api/backend-proxy";

export async function GET(request: Request): Promise<Response> {
  const url = new URL(request.url);
  return proxyAuthenticatedRequest(`/reports/exports${url.search}`, {
    method: "GET",
  });
}

export async function POST(request: Request): Promise<Response> {
  return proxyAuthenticatedRequest("/reports/exports", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: await request.text(),
  });
}
