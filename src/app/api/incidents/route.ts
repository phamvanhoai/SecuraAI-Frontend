import { proxyAuthenticatedRequest } from "@/lib/api/backend-proxy";
export async function POST(request: Request) {
  return proxyAuthenticatedRequest("/incidents", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: await request.text(),
  });
}
