import { proxyAuthenticatedRequest } from "@/lib/api/backend-proxy";

export function GET(request: Request): Promise<Response> {
  return proxyAuthenticatedRequest(
    `/ai-alerts/thresholds/assets${new URL(request.url).search}`,
  );
}
