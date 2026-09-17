import { proxyAuthenticatedRequest } from "@/lib/api/backend-proxy";
export async function GET(
  _request: Request,
  context: { params: Promise<{ policyId: string; versionId: string }> },
): Promise<Response> {
  const p = await context.params;
  return proxyAuthenticatedRequest(
    `/compliance/policies/${encodeURIComponent(p.policyId)}/versions/${encodeURIComponent(p.versionId)}/history`,
  );
}
