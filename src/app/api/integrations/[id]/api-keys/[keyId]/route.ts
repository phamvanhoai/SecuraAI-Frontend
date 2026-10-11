import { proxyAuthenticatedRequest } from "@/lib/api/backend-proxy";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string; keyId: string }> },
): Promise<Response> {
  const { id, keyId } = await context.params;
  const targetPath =
    id === "all" || !id
      ? `/integrations/api-keys/${encodeURIComponent(keyId)}`
      : `/integrations/${encodeURIComponent(id)}/api-keys/${encodeURIComponent(keyId)}`;
  return proxyAuthenticatedRequest(targetPath);
}
