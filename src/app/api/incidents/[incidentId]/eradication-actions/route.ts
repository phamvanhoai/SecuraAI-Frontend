import { proxyAuthenticatedRequest } from "@/lib/api/backend-proxy";
type Context = { params: Promise<{ incidentId: string }> };
export async function GET(request: Request, context: Context) {
  const { incidentId } = await context.params;
  const query = new URL(request.url).searchParams;
  const allowed = new URLSearchParams();
  for (const key of ["page", "limit"]) {
    const value = query.get(key);
    if (value !== null) allowed.set(key, value);
  }
  return proxyAuthenticatedRequest(
    `/incidents/${encodeURIComponent(incidentId)}/eradication-actions?${allowed}`,
    { method: "GET" },
  );
}
export async function POST(request: Request, context: Context) {
  const { incidentId } = await context.params;
  return proxyAuthenticatedRequest(
    `/incidents/${encodeURIComponent(incidentId)}/eradication-actions`,
    {
      method: "POST",
      body: await request.text(),
      headers: { "Content-Type": "application/json" },
    },
  );
}
