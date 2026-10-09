import { proxyAuthenticatedRequest } from "@/lib/api/backend-proxy";
export async function GET(
  request: Request,
  context: { params: Promise<{ incidentId: string }> },
) {
  const { incidentId } = await context.params;
  const query = new URL(request.url).searchParams;
  const allowed = new URLSearchParams();
  for (const key of ["page", "limit"]) {
    const value = query.get(key);
    if (value !== null) allowed.set(key, value);
  }
  return proxyAuthenticatedRequest(
    `/incidents/${encodeURIComponent(incidentId)}/analysis/history?${allowed}`,
    { method: "GET" },
  );
}
