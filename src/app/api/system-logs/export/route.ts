import { proxyAuthenticatedRequest } from "@/lib/api/backend-proxy";
export async function POST(request: Request): Promise<Response> {
  return proxyAuthenticatedRequest("/system-logs/export", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: await request.text(),
    signal: request.signal,
  });
}
