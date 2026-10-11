import { proxyAuthenticatedRequest } from "@/lib/api/backend-proxy";
type Context = { params: Promise<{ incidentId: string; riskId: string }> };
export async function DELETE(
  _request: Request,
  { params }: Context,
): Promise<Response> {
  const { incidentId, riskId } = await params;
  return proxyAuthenticatedRequest(
    `/incidents/${encodeURIComponent(incidentId)}/risks/${encodeURIComponent(riskId)}`,
    { method: "DELETE" },
  );
}
