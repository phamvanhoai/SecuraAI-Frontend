import { proxyAuthenticatedRequest } from "@/lib/api/backend-proxy";

export function GET(request: Request): Promise<Response> {
  return proxyAuthenticatedRequest(
    `/ai-alerts/thresholds/assets/options${new URL(request.url).search}`,
  );
}
