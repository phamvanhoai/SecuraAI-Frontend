import { proxyAuthenticatedRequest } from "@/lib/api/backend-proxy";
export async function POST(
  request: Request,
  { params }: { params: Promise<{ incidentId: string }> },
): Promise<Response> {
  const { incidentId } = await params;
  return proxyAuthenticatedRequest(
    `/incidents/${encodeURIComponent(incidentId)}/control-weaknesses`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: await request.text(),
    },
  );
}
