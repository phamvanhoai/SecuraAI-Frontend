import { apiRequest } from "@/lib/api/api-client";
import { ApiError } from "@/lib/api/api-error";
import {
  sentInSystemNotificationSchema,
  type SendInSystemNotificationInput,
} from "../schemas/send-in-system-notification-schema";

export async function sendInSystemNotification(
  input: SendInSystemNotificationInput,
) {
  const data = await apiRequest<unknown>("/api/notifications", {
    target: "same-origin",
    method: "POST",
    body: input,
  });
  const parsed = sentInSystemNotificationSchema.safeParse(data);
  if (!parsed.success)
    throw new ApiError(
      "The notification response could not be verified. Check recipient inboxes before retrying.",
      502,
      "UNKNOWN_ERROR",
    );
  return parsed.data;
}
