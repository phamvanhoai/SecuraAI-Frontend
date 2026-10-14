import { proxyAuthenticatedRequest } from "@/lib/api/backend-proxy";

export async function GET(
  _request: Request,
  context: { params: Promise<{ keyId: string }> },
): Promise<Response> {
  const { keyId } = await context.params;
  return proxyAuthenticatedRequest(`/integrations/api-keys/${encodeURIComponent(keyId)}`);
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ keyId: string }> },
): Promise<Response> {
  const { keyId } = await context.params;
  return proxyAuthenticatedRequest(`/integrations/api-keys/${encodeURIComponent(keyId)}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: await request.text(),
  });
}

