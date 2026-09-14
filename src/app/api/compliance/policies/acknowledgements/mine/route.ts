import { proxyAuthenticatedRequest } from "@/lib/api/backend-proxy";
export async function GET(request: Request) {
  return proxyAuthenticatedRequest(
    `/compliance/policies/acknowledgements/mine${new URL(request.url).search}`,
  );
}
