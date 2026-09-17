import { proxyAuthenticatedRequest } from "@/lib/api/backend-proxy";
export function GET(request: Request): Promise<Response> {
  return proxyAuthenticatedRequest(
    `/compliance/policies/version-history${new URL(request.url).search}`,
  );
}
