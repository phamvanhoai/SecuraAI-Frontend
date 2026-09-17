import { proxyAuthenticatedRequest } from "@/lib/api/backend-proxy";
export async function PATCH(
  _request: Request,
  context: { params: Promise<{ notificationId: string }> },
) {
  const { notificationId } = await context.params;
  return proxyAuthenticatedRequest(
    `/notifications/compliance-reminders/${encodeURIComponent(notificationId)}/read`,
    { method: "PATCH" },
  );
}
