import { proxyAuthenticatedRequest } from "@/lib/api/backend-proxy";

function path(policyId: string, versionId: string): string {
  return `/compliance/policies/${encodeURIComponent(policyId)}/versions/${encodeURIComponent(versionId)}/applicability`;
}

type Context = { params: Promise<{ policyId: string; versionId: string }> };

export async function GET(
  _request: Request,
  context: Context,
): Promise<Response> {
  const { policyId, versionId } = await context.params;
  return proxyAuthenticatedRequest(path(policyId, versionId));
}

export async function PUT(
  request: Request,
  context: Context,
): Promise<Response> {
  const { policyId, versionId } = await context.params;
  return proxyAuthenticatedRequest(path(policyId, versionId), {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: await request.text(),
  });
}
