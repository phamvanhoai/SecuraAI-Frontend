import { proxyAuthenticatedRequest } from "@/lib/api/backend-proxy";

type Context = {
  params: Promise<{ incidentId: string; controlId: string }>;
};

export async function DELETE(
  _request: Request,
  { params }: Context,
): Promise<Response> {
  const { incidentId, controlId } = await params;
  return proxyAuthenticatedRequest(
    `/incidents/${encodeURIComponent(incidentId)}/controls/${encodeURIComponent(controlId)}`,
    { method: "DELETE" },
  );
}
