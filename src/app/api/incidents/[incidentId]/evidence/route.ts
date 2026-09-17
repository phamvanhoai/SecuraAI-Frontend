import { proxyAuthenticatedRequest } from "@/lib/api/backend-proxy";
type Context = { params: Promise<{ incidentId: string }> };
export async function GET(request: Request, { params }: Context) {
  const { incidentId } = await params;
  const search = new URL(request.url).search;
  return proxyAuthenticatedRequest(
    `/incidents/${encodeURIComponent(incidentId)}/evidence${search}`,
    {
      signal: request.signal,
    },
  );
}
export async function POST(request: Request, { params }: Context) {
  const { incidentId } = await params;
  return proxyAuthenticatedRequest(
    `/incidents/${encodeURIComponent(incidentId)}/evidence`,
    {
      method: "POST",
      headers: {
        "content-type":
          request.headers.get("content-type") ?? "multipart/form-data",
      },
      body: await request.arrayBuffer(),
      signal: request.signal,
    },
  );
}
