import { proxyAuthenticatedRequest } from "@/lib/api/backend-proxy";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ incidentId: string }> },
): Promise<Response> {
  const { incidentId } = await params;
  const incoming = new URL(request.url).searchParams;
  const query = new URLSearchParams();
  for (const name of ["q", "scope", "page", "limit"] as const) {
    const value = incoming.get(name);
    if (value !== null) query.set(name, value);
  }
  const suffix = query.size > 0 ? `?${query.toString()}` : "";
  return proxyAuthenticatedRequest(
    `/incidents/${encodeURIComponent(incidentId)}/assets/options${suffix}`,
  );
}
