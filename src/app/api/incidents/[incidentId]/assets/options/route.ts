import { proxyAuthenticatedRequest } from "@/lib/api/backend-proxy";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ incidentId: string }> },
): Promise<Response> {
  const { incidentId } = await params;
  return proxyAuthenticatedRequest(
    `/incidents/${encodeURIComponent(incidentId)}/assets/options`,
  );
}
