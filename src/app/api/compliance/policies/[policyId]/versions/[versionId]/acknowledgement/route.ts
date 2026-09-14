import { proxyAuthenticatedRequest } from "@/lib/api/backend-proxy";
type C = { params: Promise<{ policyId: string; versionId: string }> };
export async function GET(_: Request, c: C) {
  const p = await c.params;
  return proxyAuthenticatedRequest(
    `/compliance/policies/${encodeURIComponent(p.policyId)}/versions/${encodeURIComponent(p.versionId)}/acknowledgement`,
  );
}
