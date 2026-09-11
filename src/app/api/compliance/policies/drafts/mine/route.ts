import { proxyAuthenticatedRequest } from "@/lib/api/backend-proxy";

export function GET(request: Request): Promise<Response> {
  const query = new URL(request.url).search;
  return proxyAuthenticatedRequest(`/compliance/policies/drafts/mine${query}`);
}
