import { z } from "zod";

export const sendEmailNotificationInputSchema = z
  .object({
    subject: z.string().trim().min(1).max(160),
    message: z.string().trim().min(1).max(4000),
    userIds: z.array(z.uuid()).min(1).max(20),
  })
  .strict();

export const sentEmailNotificationSchema = z.object({
  id: z.uuid(),
  recipientCount: z.number().int().positive(),
  sentCount: z.number().int().nonnegative(),
  failedCount: z.number().int().nonnegative(),
  queuedAt: z.iso.datetime({ offset: true }),
});

export type SendEmailNotificationInput = z.infer<
  typeof sendEmailNotificationInputSchema
>;
