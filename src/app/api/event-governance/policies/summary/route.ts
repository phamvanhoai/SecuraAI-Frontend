import { proxyAuthenticatedRequest } from "@/lib/api/backend-proxy";

export async function GET(): Promise<Response> {
  return proxyAuthenticatedRequest("/event-governance/policies/summary", {
    method: "GET",
  });
}
