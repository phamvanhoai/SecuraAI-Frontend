import { proxyAuthenticatedRequest } from "@/lib/api/backend-proxy";
export async function GET(request: Request): Promise<Response> {
  return proxyAuthenticatedRequest(`/risks/create-options${new URL(request.url).search}`);
}
