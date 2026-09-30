import { proxyAuthenticatedRequest } from "@/lib/api/backend-proxy";

export async function GET(
  request: Request,
  props: { params: Promise<{ batchId: string }> },
): Promise<Response> {
  const { batchId } = await props.params;
  const url = new URL(request.url);
  return proxyAuthenticatedRequest(
    `/event-sources/batches/${encodeURIComponent(batchId)}/invalid-events${url.search}`,
    {
      method: "GET",
    },
  );
}
