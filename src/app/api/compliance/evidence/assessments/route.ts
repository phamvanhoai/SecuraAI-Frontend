import { proxyAuthenticatedRequest } from "@/lib/api/backend-proxy";
export function GET(request: Request): Promise<Response> { return proxyAuthenticatedRequest(`/compliance/evidence/assessments${new URL(request.url).search}`, { signal: request.signal }); }
