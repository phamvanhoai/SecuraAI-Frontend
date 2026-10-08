import { z } from "zod";

const roleSchema = z.enum([
  "ADMIN",
  "SECURITY_OFFICER",
  "EXECUTIVE",
  "EMPLOYEE",
]);

export const sendInSystemNotificationInputSchema = z
  .object({
    title: z.string().trim().min(1).max(160),
    message: z.string().trim().min(1).max(2000),
    priority: z.enum(["NORMAL", "IMPORTANT", "URGENT"]),
    audience: z.discriminatedUnion("type", [
      z.object({
        type: z.literal("roles"),
        roles: z.array(roleSchema).min(1).max(4),
      }),
      z.object({
        type: z.literal("users"),
        userIds: z.array(z.uuid()).min(1).max(200),
      }),
    ]),
  })
  .strict();

export const sentInSystemNotificationSchema = z.object({
  id: z.uuid(),
  recipientCount: z.number().int().positive(),
  sentAt: z.iso.datetime({ offset: true }),
});

export type SendInSystemNotificationInput = z.infer<
  typeof sendInSystemNotificationInputSchema
>;
