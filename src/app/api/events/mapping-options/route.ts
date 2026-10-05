import { proxyAuthenticatedRequest } from "@/lib/api/backend-proxy";

export async function GET(): Promise<Response> {
  return proxyAuthenticatedRequest("/events/mapping-options", {
    method: "GET",
  });
}
