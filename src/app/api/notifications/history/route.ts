import { proxyAuthenticatedRequest } from "@/lib/api/backend-proxy";
export async function GET(request: Request) {
  const url = new URL(request.url);
  return proxyAuthenticatedRequest(`/notifications/history${url.search}`, {
    signal: request.signal,
  });
}
