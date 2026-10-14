import { proxyAuthenticatedRequest } from "@/lib/api/backend-proxy";

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string; keyId: string }> },
): Promise<Response> {
  const { id, keyId } = await context.params;
  const targetPath =
    id === "all" || !id
      ? `/integrations/api-keys/${encodeURIComponent(keyId)}/rotate`
      : `/integrations/${encodeURIComponent(id)}/api-keys/${encodeURIComponent(keyId)}/rotate`;
  return proxyAuthenticatedRequest(targetPath, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: await request.text(),
  });
}
