import { z } from "zod";

export const trainingReminderSchema = z.object({
  notificationId: z.string().uuid(),
  enrollmentId: z.string().uuid().nullable(),
  title: z.string(),
  message: z.string(),
  isRead: z.boolean(),
  readAt: z.string().datetime().nullable(),
  createdAt: z.string().datetime(),
});
export const trainingReminderListSchema = z.object({
  items: z.array(trainingReminderSchema),
  summary: z.object({
    total: z.number().int().nonnegative(),
    unread: z.number().int().nonnegative(),
  }),
  pagination: z.object({
    page: z.number().int().positive(),
    limit: z.number().int().min(1).max(50),
    total: z.number().int().nonnegative(),
    totalPages: z.number().int().positive(),
  }),
});
export type TrainingReminder = z.infer<typeof trainingReminderSchema>;
export type ReminderFilter = "all" | "unread";
