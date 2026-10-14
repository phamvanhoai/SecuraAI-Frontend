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

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string; keyId: string }> },
): Promise<Response> {
  const { id, keyId } = await context.params;
  const targetPath =
    id === "all" || !id
      ? `/integrations/api-keys/${encodeURIComponent(keyId)}`
      : `/integrations/${encodeURIComponent(id)}/api-keys/${encodeURIComponent(keyId)}`;
  return proxyAuthenticatedRequest(targetPath, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: await request.text(),
  });
}
