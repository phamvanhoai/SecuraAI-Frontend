import { proxyAuthenticatedRequest } from "@/lib/api/backend-proxy";
export async function GET(
  request: Request,
  { params }: { params: Promise<{ incidentId: string }> },
): Promise<Response> {
  const { incidentId } = await params;
  const search = new URL(request.url).search;
  return proxyAuthenticatedRequest(
    `/incidents/${encodeURIComponent(incidentId)}/control-weaknesses${search}`,
  );
}
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
