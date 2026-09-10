import { proxyAuthenticatedRequest } from "@/lib/api/backend-proxy";

export async function GET(request: Request): Promise<Response> {
  const query = new URL(request.url).search;
  return proxyAuthenticatedRequest(`/access-control/permissions${query}`);
}
