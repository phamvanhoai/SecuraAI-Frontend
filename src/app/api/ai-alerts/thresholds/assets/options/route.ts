import { proxyAuthenticatedRequest } from "@/lib/api/backend-proxy";

export function GET(): Promise<Response> {
  return proxyAuthenticatedRequest("/ai-alerts/thresholds/assets/options");
}
