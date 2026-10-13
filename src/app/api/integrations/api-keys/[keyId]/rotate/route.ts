import { proxyAuthenticatedRequest } from "@/lib/api/backend-proxy";

export async function POST(
  request: Request,
  context: { params: Promise<{ keyId: string }> },
): Promise<Response> {
  const { keyId } = await context.params;
  return proxyAuthenticatedRequest(
    `/integrations/api-keys/${encodeURIComponent(keyId)}/rotate`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: await request.text(),
    },
  );
}
