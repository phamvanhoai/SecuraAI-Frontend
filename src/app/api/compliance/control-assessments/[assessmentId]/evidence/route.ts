import { proxyAuthenticatedRequest } from "@/lib/api/backend-proxy";
type Context = { params: Promise<{ assessmentId: string }> };
export async function POST(request: Request, { params }: Context): Promise<Response> { const { assessmentId } = await params; return proxyAuthenticatedRequest(`/compliance/control-assessments/${encodeURIComponent(assessmentId)}/evidence`, { method: "POST", headers: { "content-type": request.headers.get("content-type") ?? "multipart/form-data" }, body: await request.arrayBuffer(), signal: request.signal }); }
