import { proxyAuthenticatedRequest } from "@/lib/api/backend-proxy";
type Context = { params: Promise<{ incidentId: string }> };
export async function GET(_request: Request, context: Context) {
  const { incidentId } = await context.params;
  return proxyAuthenticatedRequest(
    `/incidents/${encodeURIComponent(incidentId)}/analysis`,
    { method: "GET" },
  );
}
export async function PATCH(request: Request, context: Context) {
  const { incidentId } = await context.params;
  return proxyAuthenticatedRequest(
    `/incidents/${encodeURIComponent(incidentId)}/analysis`,
    {
      method: "PATCH",
      body: await request.text(),
      headers: { "Content-Type": "application/json" },
    },
  );
}
