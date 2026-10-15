import { z } from "zod";

export const notificationChannelsSchema = z
  .object({
    inSystem: z.boolean(),
    email: z.boolean(),
  })
  .strict()
  .refine((channels) => channels.inSystem || channels.email, {
    message: "At least one notification channel must be enabled.",
  });

export const updateNotificationPreferencesInputSchema = z
  .object({ channels: notificationChannelsSchema })
  .strict();

export const notificationPreferencesSchema = z.object({
  channels: notificationChannelsSchema,
  updatedAt: z.iso.datetime({ offset: true }).nullable(),
});

export type NotificationChannels = z.infer<typeof notificationChannelsSchema>;
export type UpdateNotificationPreferencesInput = z.infer<
  typeof updateNotificationPreferencesInputSchema
>;
