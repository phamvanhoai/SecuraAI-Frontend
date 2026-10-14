import { proxyAuthenticatedRequest } from "@/lib/api/backend-proxy";

type Context = { params: Promise<{ incidentId: string }> };

export async function POST(
  request: Request,
  { params }: Context,
): Promise<Response> {
  const { incidentId } = await params;
  return proxyAuthenticatedRequest(
    `/incidents/${encodeURIComponent(incidentId)}/assets`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: await request.text(),
    },
  );
}
