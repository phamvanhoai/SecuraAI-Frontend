import { proxyAuthenticatedRequest } from "@/lib/api/backend-proxy";

export function GET() {
  return proxyAuthenticatedRequest("/incidents/assignment-options");
}
