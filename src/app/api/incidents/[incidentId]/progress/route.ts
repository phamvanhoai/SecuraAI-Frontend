import type { NextRequest } from "next/server";
import { proxyAuthenticatedRequest } from "@/lib/api/backend-proxy";
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ incidentId: string }> },
) {
  const { incidentId } = await context.params;
  return proxyAuthenticatedRequest(
    `/incidents/${encodeURIComponent(incidentId)}/progress${request.nextUrl.search}`,
    { method: "GET" },
  );
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ incidentId: string }> },
) {
  const { incidentId } = await context.params;
  return proxyAuthenticatedRequest(
    `/incidents/${encodeURIComponent(incidentId)}/progress`,
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: await request.text(),
    },
  );
}
