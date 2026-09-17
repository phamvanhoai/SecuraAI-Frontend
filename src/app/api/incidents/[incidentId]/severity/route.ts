import { proxyAuthenticatedRequest } from "@/lib/api/backend-proxy";

export async function PATCH(
  request: Request,
  context: { params: Promise<{ incidentId: string }> },
): Promise<Response> {
  const { incidentId } = await context.params;
  return proxyAuthenticatedRequest(
    `/incidents/${encodeURIComponent(incidentId)}/severity`,
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: await request.text(),
    },
  );
}
