import { apiRequest } from "@/lib/api/api-client";
import { ApiError } from "@/lib/api/api-error";
import {
  sentEmailNotificationSchema,
  type SendEmailNotificationInput,
} from "../schemas/send-email-notification-schema";

export async function sendEmailNotification(input: SendEmailNotificationInput) {
  const data = await apiRequest<unknown>("/api/notifications/email", {
    target: "same-origin",
    method: "POST",
    body: input,
  });
  const parsed = sentEmailNotificationSchema.safeParse(data);
  if (!parsed.success)
    throw new ApiError(
      "The delivery response could not be verified. Check delivery history before retrying.",
      502,
      "UNKNOWN_ERROR",
    );
  return parsed.data;
}
