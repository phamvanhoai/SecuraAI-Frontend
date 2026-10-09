import { proxyAuthenticatedRequest } from "@/lib/api/backend-proxy";
export async function GET(request: Request) { const url = new URL(request.url); return proxyAuthenticatedRequest(`/notifications/inbox${url.search}`, { signal: request.signal }); }
export async function PATCH(request: Request) { return proxyAuthenticatedRequest("/notifications/inbox/read-all", { method: "PATCH", signal: request.signal }); }
