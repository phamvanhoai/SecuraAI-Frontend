import { proxyAuthenticatedRequest } from "@/lib/api/backend-proxy";

export async function GET(
  _request: Request,
  context: { params: Promise<{ policyId: string; versionId: string }> },
): Promise<Response> {
  const { policyId, versionId } = await context.params;
  return proxyAuthenticatedRequest(
    `/compliance/policies/${encodeURIComponent(policyId)}/versions/${encodeURIComponent(versionId)}/review`,
  );
}
