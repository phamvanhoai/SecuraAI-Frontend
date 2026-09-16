import { proxyAuthenticatedRequest } from "@/lib/api/backend-proxy";

export async function GET(request: Request): Promise<Response> {
  const url = new URL(request.url);
  const search = url.search;
  return proxyAuthenticatedRequest(
    `/integrations/monitoring/connection-status${search}`,
  );
}
