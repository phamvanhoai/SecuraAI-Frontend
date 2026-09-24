import { z } from "zod";

export const revisionScopes = ["risk_assessment", "treatment_plan", "both"] as const;

export const returnTreatmentPlanForRevisionRequestSchema = z.object({
  approvalRequestId: z.uuid(),
  revisionScope: z.enum(revisionScopes),
  reason: z.string().trim().min(10).max(1000),
});

export const returnedTreatmentPlanForRevisionSchema = z.object({
  treatmentPlanId: z.uuid(),
  riskAssessmentId: z.uuid(),
  approvalRequestId: z.uuid(),
  planStatus: z.literal("rejected"),
  riskStatus: z.literal("rejected"),
  approvalStatus: z.literal("rejected"),
  revisionScope: z.enum(revisionScopes),
  reason: z.string(),
  returnedAt: z.iso.datetime({ offset: true }),
});

export type ReturnTreatmentPlanForRevisionRequest = z.infer<
  typeof returnTreatmentPlanForRevisionRequestSchema
>;
export type ReturnedTreatmentPlanForRevision = z.infer<
  typeof returnedTreatmentPlanForRevisionSchema
>;
