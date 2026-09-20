import { proxyAuthenticatedRequest } from "@/lib/api/backend-proxy";

export async function GET(): Promise<Response> {
  return proxyAuthenticatedRequest("/admin/users/create-options");
}
