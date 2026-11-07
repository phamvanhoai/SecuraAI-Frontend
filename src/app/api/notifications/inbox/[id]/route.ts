import { proxyAuthenticatedRequest } from "@/lib/api/backend-proxy";
export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
 const { id } = await context.params;
 return proxyAuthenticatedRequest(`/notifications/inbox/${encodeURIComponent(id)}`, { signal: request.signal });
}
