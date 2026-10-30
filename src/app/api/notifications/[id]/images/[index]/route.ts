import { proxyAuthenticatedRequest } from "@/lib/api/backend-proxy";
export async function GET(request: Request, context: { params: Promise<{ id: string; index: string }> }): Promise<Response> {
  const { id, index } = await context.params;
  const response = await proxyAuthenticatedRequest("/notifications/" + encodeURIComponent(id) + "/images/" + encodeURIComponent(index), { signal: request.signal });
  response.headers.set("Cache-Control", "private, no-store");
  response.headers.set("X-Content-Type-Options", "nosniff");
  return response;
}
