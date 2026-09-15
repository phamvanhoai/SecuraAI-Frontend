import { proxyAuthenticatedRequest } from "@/lib/api/backend-proxy";

export async function POST(
  _request: Request,
  context: { params: Promise<{ id: string; keyId: string }> },
): Promise<Response> {
  const { id, keyId } = await context.params;
  return proxyAuthenticatedRequest(
    `/integrations/${encodeURIComponent(id)}/api-keys/${encodeURIComponent(keyId)}/revoke`,
    {
      method: "POST",
    },
  );
}
