import { proxyAuthenticatedRequest } from "@/lib/api/backend-proxy";

export async function GET(
  _request: Request,
  context: { params: Promise<{ keyId: string }> },
): Promise<Response> {
  const { keyId } = await context.params;
  return proxyAuthenticatedRequest(`/integrations/api-keys/${encodeURIComponent(keyId)}`);
}
