import { proxyAuthenticatedRequest } from "@/lib/api/backend-proxy";

export async function POST(
  request: Request,
  context: { params: Promise<{ policyId: string; versionId: string }> },
) {
  const { policyId, versionId } = await context.params;
  return proxyAuthenticatedRequest(
    `/compliance/policies/${encodeURIComponent(policyId)}/versions/${encodeURIComponent(versionId)}/reject`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: await request.text(),
    },
  );
}
