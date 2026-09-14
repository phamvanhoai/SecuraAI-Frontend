import { proxyAuthenticatedRequest } from "@/lib/api/backend-proxy";

export function GET(request: Request): Promise<Response> {
  return proxyAuthenticatedRequest(`/training/courses${new URL(request.url).search}`);
}

export async function POST(request: Request): Promise<Response> {
  return proxyAuthenticatedRequest("/training/courses", {
    method: "POST", headers: { "Content-Type": "application/json" }, body: await request.text(),
  });
}
