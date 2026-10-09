import { apiRequest } from "@/lib/api/api-client";
import { ApiError } from "@/lib/api/api-error";
import {
  notificationPreferencesSchema,
  type UpdateNotificationPreferencesInput,
} from "../schemas/notification-preferences-schema";

function parsePreferences(value: unknown) {
  const parsed = notificationPreferencesSchema.safeParse(value);
  if (!parsed.success)
    throw new ApiError(
      "The notification preference response could not be verified.",
      502,
      "UNKNOWN_ERROR",
    );
  return parsed.data;
}

export async function getNotificationPreferences(signal?: AbortSignal) {
  return parsePreferences(
    await apiRequest<unknown>("/api/notifications/preferences", {
      target: "same-origin",
      ...(signal ? { signal } : {}),
    }),
  );
}

export async function updateNotificationPreferences(
  input: UpdateNotificationPreferencesInput,
) {
  return parsePreferences(
    await apiRequest<unknown>("/api/notifications/preferences", {
      target: "same-origin",
      method: "PATCH",
      body: input,
    }),
  );
}
