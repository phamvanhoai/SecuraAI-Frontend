import { proxyAuthenticatedRequest } from "@/lib/api/backend-proxy";
type Context = { params: Promise<{ controlId: string }> };
export async function GET(request: Request, { params }: Context): Promise<Response> { const { controlId } = await params; return proxyAuthenticatedRequest(`/compliance/controls/${encodeURIComponent(controlId)}/assessments`, { signal: request.signal }); }
export async function POST(request: Request, { params }: Context): Promise<Response> { const { controlId } = await params; return proxyAuthenticatedRequest(`/compliance/controls/${encodeURIComponent(controlId)}/assessments`, { method: "POST", body: await request.text(), headers: { "content-type": "application/json" }, signal: request.signal }); }
