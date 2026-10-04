import { proxyAuthenticatedRequest } from "@/lib/api/backend-proxy";

export async function PUT(
  request: Request,
  props: { params: Promise<{ id: string }> },
): Promise<Response> {
  const { id } = await props.params;
  const body = (await request.text()) || "{}";

  return proxyAuthenticatedRequest(`/events/${encodeURIComponent(id)}/mappings`, {
    method: "PUT",
    body,
    headers: {
      "Content-Type": "application/json",
    },
  });
}
