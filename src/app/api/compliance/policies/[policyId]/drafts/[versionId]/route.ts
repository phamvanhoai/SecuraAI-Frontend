import { proxyAuthenticatedRequest } from "@/lib/api/backend-proxy";

function draftPath(policyId: string, versionId: string): string {
  return `/compliance/policies/${encodeURIComponent(policyId)}/drafts/${encodeURIComponent(versionId)}`;
}

export async function GET(
  _request: Request,
  context: { params: Promise<{ policyId: string; versionId: string }> },
): Promise<Response> {
  const { policyId, versionId } = await context.params;
  return proxyAuthenticatedRequest(draftPath(policyId, versionId));
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ policyId: string; versionId: string }> },
): Promise<Response> {
  const { policyId, versionId } = await context.params;
  return proxyAuthenticatedRequest(draftPath(policyId, versionId), {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: await request.text(),
  });
}
