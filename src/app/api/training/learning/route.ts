import { proxyAuthenticatedRequest } from "@/lib/api/backend-proxy";
export function GET(request: Request): Promise<Response> {
  const url = new URL(request.url);
  return proxyAuthenticatedRequest(
    `/training/learning?${url.searchParams.toString()}`,
    { signal: request.signal },
  );
}
