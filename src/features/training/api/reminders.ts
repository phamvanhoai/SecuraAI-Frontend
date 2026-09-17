import { apiRequest } from "@/lib/api/api-client";
import {
  trainingReminderListSchema,
  trainingReminderSchema,
  type ReminderFilter,
} from "../schemas/reminder-schema";

export async function listTrainingReminders(
  page: number,
  status: ReminderFilter,
  search: string,
  signal?: AbortSignal,
) {
  return trainingReminderListSchema.parse(
    await apiRequest<unknown>("/api/training/deadline-reminders", {
      target: "same-origin",
      query: { page, limit: 10, status, ...(search ? { search } : {}) },
      ...(signal ? { signal } : {}),
    }),
  );
}
export async function markTrainingReminderRead(notificationId: string) {
  return trainingReminderSchema.parse(
    await apiRequest<unknown>(
      `/api/training/deadline-reminders/${encodeURIComponent(notificationId)}/read`,
      { target: "same-origin", method: "PATCH" },
    ),
  );
}
