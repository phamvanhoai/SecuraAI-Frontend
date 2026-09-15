import { z } from "zod";

export const mfaRecoveryStatusSchema = z.enum([
  "pending",
  "approved",
  "rejected",
]);

export const mfaRecoveryRequestSchema = z.object({
  id: z.string().uuid(),
  status: mfaRecoveryStatusSchema,
  submittedAt: z.coerce.date(),
  completedAt: z.coerce.date().nullable().optional(),
  user: z
    .object({
      id: z.string().uuid(),
      email: z.string().email(),
      fullName: z.string(),
    })
    .nullable()
    .optional(),
  decision: z
    .object({
      decision: z.enum(["approved", "rejected"]),
      reason: z.string(),
      actedAt: z.coerce.date(),
      reviewer: z
        .object({ id: z.string().uuid(), fullName: z.string() })
        .nullable(),
    })
    .nullable()
    .optional(),
});

export const mfaRecoveryListSchema = z.object({
  items: z.array(mfaRecoveryRequestSchema),
  pagination: z.object({
    page: z.number().int().positive(),
    limit: z.number().int().positive(),
    total: z.number().int().nonnegative(),
    totalPages: z.number().int().nonnegative(),
  }),
});

export const decideMfaRecoverySchema = z.object({
  reason: z.string().trim().min(10).max(2000),
});
export type MfaRecoveryStatus = z.infer<typeof mfaRecoveryStatusSchema>;
export type MfaRecoveryRequest = z.infer<typeof mfaRecoveryRequestSchema>;
export type MfaRecoveryList = z.infer<typeof mfaRecoveryListSchema>;
