import { z } from "zod";

export const accountLockParamsSchema = z.strictObject({
  userId: z.uuid(),
  action: z.enum(["lock", "unlock"]),
});

export const accountLockBodySchema = z.strictObject({
  reason: z
    .string()
    .normalize("NFKC")
    .trim()
    .min(10, "Reason must contain at least 10 characters.")
    .max(1000, "Reason must not exceed 1,000 characters."),
});

export const accountLockResultSchema = z.object({
  id: z.uuid(),
  status: z.enum(["active", "locked"]),
  lastLockedAt: z.iso.datetime({ offset: true }).nullable(),
  updatedAt: z.iso.datetime({ offset: true }),
  changed: z.boolean(),
});

export type AccountLockAction = z.infer<
  typeof accountLockParamsSchema
>["action"];
export type AccountLockInput = z.infer<typeof accountLockBodySchema>;
export type AccountLockResult = z.infer<typeof accountLockResultSchema>;
