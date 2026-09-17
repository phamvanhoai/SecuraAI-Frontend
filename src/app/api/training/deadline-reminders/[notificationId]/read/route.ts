import { proxyAuthenticatedRequest } from "@/lib/api/backend-proxy";

export async function PATCH(
  _request: Request,
  context: { params: Promise<{ notificationId: string }> },
): Promise<Response> {
  const { notificationId } = await context.params;
  const response = await proxyAuthenticatedRequest(
    `/training/deadline-reminders/${encodeURIComponent(notificationId)}/read`,
    { method: "PATCH" },
  );
  response.headers.set("Cache-Control", "private, no-store");
  return response;
}
