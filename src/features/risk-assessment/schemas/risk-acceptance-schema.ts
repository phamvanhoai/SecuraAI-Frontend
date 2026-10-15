import { z } from "zod";
export const submitRiskAcceptanceSchema = z.object({
  residualLikelihood: z.coerce.number().int().min(1).max(5),
  residualImpact: z.coerce.number().int().min(1).max(5),
  assessmentReason: z.string().trim().min(10).max(2000),
  treatmentPlanId: z.string().uuid(),
  treatmentPlanStatus: z.enum(["draft", "active", "completed"]).optional(),
  validUntil: z.iso.date(),
  acceptanceReason: z.string().trim().min(10).max(2000),
});
export const decideRiskAcceptanceSchema = z.object({
  decision: z.enum(["approved", "rejected"]),
  reason: z.string().trim().min(10).max(2000),
});
export type SubmitRiskAcceptance = z.infer<typeof submitRiskAcceptanceSchema>;
export type DecideRiskAcceptance = z.infer<typeof decideRiskAcceptanceSchema>;
export const openRiskReviewSchema = z
  .object({
    reason: z.string().trim().min(10).max(2000),
    expectedUpdatedAt: z.iso.datetime({ offset: true }),
  })
  .strict();
export type OpenRiskReview = z.infer<typeof openRiskReviewSchema>;
