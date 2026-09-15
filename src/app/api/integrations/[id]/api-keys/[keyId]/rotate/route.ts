import { proxyAuthenticatedRequest } from "@/lib/api/backend-proxy";

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string; keyId: string }> },
): Promise<Response> {
  const { id, keyId } = await context.params;
  return proxyAuthenticatedRequest(
    `/integrations/${encodeURIComponent(id)}/api-keys/${encodeURIComponent(keyId)}/rotate`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: await request.text(),
    },
  );
}
