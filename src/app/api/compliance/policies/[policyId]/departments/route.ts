import { proxyAuthenticatedRequest } from "@/lib/api/backend-proxy";

type Context = { params: Promise<{ policyId: string }> };

export async function PUT(
  request: Request,
  context: Context,
): Promise<Response> {
  const { policyId } = await context.params;
  return proxyAuthenticatedRequest(
    `/compliance/policies/${encodeURIComponent(policyId)}/departments`,
    {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: await request.text(),
    },
  );
}
