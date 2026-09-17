import { proxyAuthenticatedRequest } from "@/lib/api/backend-proxy";

export async function GET() {
  return proxyAuthenticatedRequest("/compliance/frameworks");
}
