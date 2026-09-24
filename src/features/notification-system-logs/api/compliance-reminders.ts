import { apiRequest } from "@/lib/api/api-client";
import {
  complianceReminderListSchema,
  complianceReminderSchema,
  type ComplianceReminderFilter,
} from "../schemas/compliance-reminder-schema";
export async function listComplianceReminders(
  page: number,
  status: ComplianceReminderFilter,
  search: string,
  signal?: AbortSignal,
) {
  return complianceReminderListSchema.parse(
    await apiRequest<unknown>("/api/notifications/compliance-reminders", {
      target: "same-origin",
      query: { page, limit: 10, status, ...(search ? { search } : {}) },
      ...(signal ? { signal } : {}),
    }),
  );
}
export async function markComplianceReminderRead(id: string) {
  return complianceReminderSchema.parse(
    await apiRequest<unknown>(
      `/api/notifications/compliance-reminders/${encodeURIComponent(id)}/read`,
      { target: "same-origin", method: "PATCH" },
    ),
  );
}
