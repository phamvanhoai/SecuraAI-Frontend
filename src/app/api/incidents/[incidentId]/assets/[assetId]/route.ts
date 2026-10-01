import { proxyAuthenticatedRequest } from "@/lib/api/backend-proxy";

type Context = {
  params: Promise<{ incidentId: string; assetId: string }>;
};

export async function DELETE(
  _request: Request,
  { params }: Context,
): Promise<Response> {
  const { incidentId, assetId } = await params;
  return proxyAuthenticatedRequest(
    `/incidents/${encodeURIComponent(incidentId)}/assets/${encodeURIComponent(assetId)}`,
    { method: "DELETE" },
  );
}
