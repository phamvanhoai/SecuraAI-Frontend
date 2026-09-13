import { proxyAuthenticatedRequest } from "@/lib/api/backend-proxy";

export function GET(): Promise<Response> {
  return proxyAuthenticatedRequest("/compliance/policies/published/mine");
}
