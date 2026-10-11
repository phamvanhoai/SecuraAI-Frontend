import { proxyAuthenticatedRequest } from "@/lib/api/backend-proxy";

export async function GET(
  request: Request,
  context: { params: Promise<{ incidentId: string }> },
): Promise<Response> {
  const { incidentId } = await context.params;
  const query = new URL(request.url).searchParams;
  const allowed = new URLSearchParams();
  for (const key of ["page", "limit"]) {
    const value = query.get(key);
    if (value !== null) allowed.set(key, value);
  }
  return proxyAuthenticatedRequest(
    `/incidents/${encodeURIComponent(incidentId)}/severity?${allowed}`,
    { method: "GET" },
  );
}

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
