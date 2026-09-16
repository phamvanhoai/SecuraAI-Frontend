import { proxyAuthenticatedRequest } from "@/lib/api/backend-proxy";

type Context = {
  params: Promise<{ policyId: string; versionId: string; frameworkId: string }>;
};

export async function PUT(request: Request, context: Context) {
  const { policyId, versionId, frameworkId } = await context.params;
  return proxyAuthenticatedRequest(
    `/compliance/policies/${encodeURIComponent(policyId)}/versions/${encodeURIComponent(versionId)}/frameworks/${encodeURIComponent(frameworkId)}/control-mappings`,
    {
      method: "PUT",
      body: await request.text(),
      headers: { "Content-Type": "application/json" },
    },
  );
}
