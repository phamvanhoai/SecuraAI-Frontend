import { proxyAuthenticatedRequest } from "@/lib/api/backend-proxy";

export async function GET(request: Request): Promise<Response> {
  const url = new URL(request.url);
  return proxyAuthenticatedRequest(`/dashboard/security-posture${url.search}`, {
    method: "GET",
  });
}
