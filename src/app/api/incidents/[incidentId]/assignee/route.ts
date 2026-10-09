import type { NextRequest } from "next/server";
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
    `/incidents/${encodeURIComponent(incidentId)}/assignee?${allowed}`,
    { method: "GET" },
  );
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ incidentId: string }> },
) {
  const { incidentId } = await context.params;
  return proxyAuthenticatedRequest(
    `/incidents/${encodeURIComponent(incidentId)}/assignee`,
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: await request.text(),
    },
  );
}
