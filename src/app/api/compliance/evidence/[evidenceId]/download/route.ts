import { proxyAuthenticatedRequest } from "@/lib/api/backend-proxy";
type Context = { params: Promise<{ evidenceId: string }> };
export async function GET(request: Request, { params }: Context): Promise<Response> { const { evidenceId } = await params; return proxyAuthenticatedRequest(`/compliance/evidence/${encodeURIComponent(evidenceId)}/download`, { signal: request.signal }); }
