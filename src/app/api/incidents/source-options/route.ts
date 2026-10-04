import { proxyAuthenticatedRequest } from "@/lib/api/backend-proxy";

export function GET(request: Request) {
  return proxyAuthenticatedRequest(
    `/incidents/source-options${new URL(request.url).search}`,
  );
}
