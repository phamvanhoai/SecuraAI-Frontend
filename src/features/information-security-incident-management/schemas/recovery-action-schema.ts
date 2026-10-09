import { z } from "zod";

export const recoveryFormSchema = z.object({
  description: z
    .string()
    .trim()
    .min(10, "Enter at least 10 characters.")
    .max(4000),
  performedAt: z
    .string()
    .min(1, "Choose when the action was performed.")
    .refine(
      (value) =>
        Number.isFinite(new Date(value).getTime()) &&
        new Date(value).getTime() <= Date.now(),
      "Choose a valid time that is not in the future.",
    ),
});
export type RecoveryForm = z.infer<typeof recoveryFormSchema>;
export const recoveryActionSchema = z.object({
  id: z.uuid(),
  phase: z.literal("recovery"),
  description: z.string(),
  performedAt: z.iso.datetime(),
  recordedAt: z.iso.datetime(),
  performedBy: z.object({ id: z.uuid(), name: z.string() }),
});
export const recoveryHistorySchema = z.object({
  items: z.array(recoveryActionSchema),
  pagination: z.object({
    page: z.number().int().positive(),
    limit: z.number().int().positive(),
    total: z.number().int().nonnegative(),
    totalPages: z.number().int().nonnegative(),
  }),
});
