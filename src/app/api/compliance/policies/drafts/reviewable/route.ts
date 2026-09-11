import { proxyAuthenticatedRequest } from "@/lib/api/backend-proxy";

export async function GET(request: Request): Promise<Response> {
  return proxyAuthenticatedRequest(
    `/compliance/policies/drafts/reviewable${new URL(request.url).search}`,
  );
}
