import { proxyAuthenticatedRequest } from "@/lib/api/backend-proxy";

export async function GET(
  _request: Request,
  props: { params: Promise<{ batchId: string }> },
): Promise<Response> {
  const { batchId } = await props.params;
  return proxyAuthenticatedRequest(
    `/event-sources/batches/${encodeURIComponent(batchId)}`,
    {
      method: "GET",
    },
  );
}
