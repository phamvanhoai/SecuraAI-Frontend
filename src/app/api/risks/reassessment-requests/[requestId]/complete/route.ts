import { proxyAuthenticatedRequest } from "@/lib/api/backend-proxy";
export async function POST(request: Request, { params }: { params: Promise<{ requestId: string }> }): Promise<Response> {
  const { requestId } = await params;
  return proxyAuthenticatedRequest(`/risks/reassessment-requests/${encodeURIComponent(requestId)}/complete`, { method: "POST", headers: { "Content-Type": "application/json" }, body: await request.text() });
}
