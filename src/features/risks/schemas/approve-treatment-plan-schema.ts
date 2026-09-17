import { z } from "zod";

export const approveTreatmentPlanRequestSchema = z.object({
  approvalRequestId: z.uuid(),
  comment: z.string().trim().max(1000).optional(),
});

export const approvedTreatmentPlanSchema = z.object({
  treatmentPlanId: z.uuid(),
  riskAssessmentId: z.uuid(),
  approvalRequestId: z.uuid(),
  planStatus: z.string(),
  approvalStatus: z.string(),
  currentStep: z.number().int().positive(),
  stepCompleted: z.boolean(),
  approvalCount: z.number().int().nonnegative(),
  requiredApprovals: z.number().int().positive(),
});

export type ApproveTreatmentPlanRequest = z.infer<typeof approveTreatmentPlanRequestSchema>;
export type ApprovedTreatmentPlan = z.infer<typeof approvedTreatmentPlanSchema>;
