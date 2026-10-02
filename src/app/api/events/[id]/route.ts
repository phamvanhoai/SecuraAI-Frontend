import { proxyAuthenticatedRequest } from "@/lib/api/backend-proxy";

export async function GET(
  _request: Request,
  props: { params: Promise<{ id: string }> },
): Promise<Response> {
  const { id } = await props.params;
  return proxyAuthenticatedRequest(`/events/${encodeURIComponent(id)}`, {
    method: "GET",
  });
}
