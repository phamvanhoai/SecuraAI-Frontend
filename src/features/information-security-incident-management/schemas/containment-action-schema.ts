import { z } from "zod";

export const containmentFormSchema = z.object({
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
export type ContainmentForm = z.infer<typeof containmentFormSchema>;
export const containmentActionSchema = z.object({
  id: z.uuid(),
  phase: z.literal("containment"),
  description: z.string(),
  performedAt: z.iso.datetime(),
  recordedAt: z.iso.datetime(),
  performedBy: z.object({ id: z.uuid(), name: z.string() }),
});
export const containmentHistorySchema = z.object({
  items: z.array(containmentActionSchema),
  pagination: z.object({
    page: z.number().int().positive(),
    limit: z.number().int().positive(),
    total: z.number().int().nonnegative(),
    totalPages: z.number().int().nonnegative(),
  }),
});
