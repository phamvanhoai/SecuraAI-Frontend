import { z } from "zod";
import { ApiError } from "@/lib/api/api-error";
import { apiRequest } from "@/lib/api/api-client";

const notificationInboxSchema = z.object({
  items: z.array(
    z.object({
      id: z.uuid(),
      title: z.string(),
      message: z.string(),
      priority: z.string(),
      sender: z.string(),
      createdAt: z.iso.datetime({ offset: true }),
      readAt: z.iso.datetime({ offset: true }).nullable(),
    }),
  ),
  unreadCount: z.number().int().nonnegative(),
});
export async function getNotificationInbox(
  limit: number,
  signal?: AbortSignal,
) {
  const data = await apiRequest<unknown>("/api/notifications/inbox", {
    target: "same-origin",
    query: { page: 1, limit },
    ...(signal ? { signal } : {}),
  });
  const parsed = notificationInboxSchema.safeParse(data);
  if (!parsed.success)
    throw new ApiError(
      "The notification inbox response could not be verified.",
      502,
      "UNKNOWN_ERROR",
    );
  return parsed.data;
}
export function markNotificationRead(id: string) {
  return apiRequest(`/api/notifications/inbox/${encodeURIComponent(id)}/read`, {
    method: "PATCH",
    target: "same-origin",
  });
}
export function markAllNotificationsRead() {
  return apiRequest("/api/notifications/inbox", {
    method: "PATCH",
    target: "same-origin",
  });
}
