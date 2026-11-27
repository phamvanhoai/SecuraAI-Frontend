import { proxyAuthenticatedRequest } from "@/lib/api/backend-proxy";

export async function POST(request: Request): Promise<Response> {
  const rawBody = await request.text();
  return proxyAuthenticatedRequest("/event-governance/retention-purge/run", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: rawBody || "{}",
  });
}
