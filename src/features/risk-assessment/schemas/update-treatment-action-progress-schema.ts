import { z } from "zod";

export const updateTreatmentActionProgressRequestSchema = z.strictObject({
  expectedUpdatedAt: z.iso.datetime({ offset: true }),
  progressPercent: z.number().int().min(0).max(100),
  progressNote: z.string().trim().min(10).max(1000).optional(),
});

export const updateTreatmentActionProgressResponseSchema = z.object({
  actionId: z.uuid(),
  treatmentPlanId: z.uuid(),
  progressPercent: z.number().int().min(0).max(100),
  status: z.enum(["pending", "in_progress", "completed"]),
  completedAt: z.iso.datetime({ offset: true }).nullable(),
  updatedAt: z.iso.datetime({ offset: true }),
  planStatus: z.enum(["approved", "in_progress", "completed"]),
  riskStatus: z.enum(["approved", "in_treatment"]),
  progressPercentAverage: z.number().int().min(0).max(100).nullable(),
  totalActions: z.number().int().min(0),
  completedActions: z.number().int().min(0),
  allActionsCompleted: z.boolean(),
});

export type UpdateTreatmentActionProgressRequest = z.infer<
  typeof updateTreatmentActionProgressRequestSchema
>;
export type UpdatedTreatmentActionProgress = z.infer<
  typeof updateTreatmentActionProgressResponseSchema
>;
