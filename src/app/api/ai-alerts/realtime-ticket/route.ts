import { proxyAuthenticatedRequest } from "@/lib/api/backend-proxy";

export function POST(): Promise<Response> {
  return proxyAuthenticatedRequest("/ai-alerts/realtime-ticket", {
    method: "POST",
  });
}
