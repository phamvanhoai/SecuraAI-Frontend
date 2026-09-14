import { proxyAuthenticatedRequest } from "@/lib/api/backend-proxy";
type Context = { params: Promise<{ policyId: string; versionId: string }> };
export async function POST(_: Request, context: Context) {
  const p = await context.params;
  return proxyAuthenticatedRequest(
    `/compliance/policies/${encodeURIComponent(p.policyId)}/versions/${encodeURIComponent(p.versionId)}/acknowledgements`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "{}",
    },
  );
}
