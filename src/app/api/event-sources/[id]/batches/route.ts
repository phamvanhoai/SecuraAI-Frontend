import { proxyAuthenticatedRequest } from "@/lib/api/backend-proxy";

export async function GET(
  request: Request,
  props: { params: Promise<{ id: string }> },
): Promise<Response> {
  const { id } = await props.params;
  const url = new URL(request.url);
  return proxyAuthenticatedRequest(
    `/event-sources/${encodeURIComponent(id)}/batches${url.search}`,
    {
      method: "GET",
    },
  );
}
