import { z } from "zod";
export const complianceReminderSchema = z.object({
  notificationId: z.uuid(),
  enrollmentId: z.uuid().nullable(),
  entityId: z.uuid().nullable(),
  kind: z.enum(["control_review", "evidence_expiry"]),
  title: z.string(),
  message: z.string(),
  isRead: z.boolean(),
  readAt: z.string().datetime().nullable(),
  createdAt: z.string().datetime(),
});
export const complianceReminderListSchema = z.object({
  items: z.array(complianceReminderSchema),
  pagination: z.object({
    page: z.number(),
    limit: z.number(),
    total: z.number(),
    totalPages: z.number(),
  }),
});
export type ComplianceReminder = z.infer<typeof complianceReminderSchema>;
export type ComplianceReminderFilter = "all" | "unread";
