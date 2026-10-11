import { proxyAuthenticatedRequest } from "@/lib/api/backend-proxy";
export async function PATCH(_request: Request, context: { params: Promise<{ id: string }> }) { const { id } = await context.params; return proxyAuthenticatedRequest(`/notifications/inbox/${encodeURIComponent(id)}/read`, { method: "PATCH" }); }
