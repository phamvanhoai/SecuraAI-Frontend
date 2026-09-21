import { z } from "zod";
import { treatmentPlanDetailSchema } from "./treatment-plan-detail-schema";

export const cancelTreatmentPlanRequestSchema = z.object({
  expectedUpdatedAt: z.iso.datetime({ offset: true }),
  reason: z.string().trim().min(10).max(1000),
});

export const cancelledTreatmentPlanSchema = treatmentPlanDetailSchema;
export type CancelTreatmentPlanRequest = z.infer<typeof cancelTreatmentPlanRequestSchema>;
