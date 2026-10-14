import { proxyAuthenticatedRequest } from "@/lib/api/backend-proxy";

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> },
): Promise<Response> {
  const { id } = await context.params;
  const url = new URL(request.url);
  const search = url.search;
  const targetPath =
    id === "all" || !id
      ? `/integrations/api-keys${search}`
      : `/integrations/${encodeURIComponent(id)}/api-keys${search}`;
  return proxyAuthenticatedRequest(targetPath);
}

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
): Promise<Response> {
  const { id } = await context.params;
  const targetPath =
    id === "all" || !id
      ? "/integrations/api-keys"
      : `/integrations/${encodeURIComponent(id)}/api-keys`;
  return proxyAuthenticatedRequest(
    targetPath,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: await request.text(),
    },
  );
}
