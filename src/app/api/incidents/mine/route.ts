import { proxyAuthenticatedRequest } from "@/lib/api/backend-proxy";
export function GET(request: Request) {
  return proxyAuthenticatedRequest(
    `/incidents/mine${new URL(request.url).search}`,
  );
}
