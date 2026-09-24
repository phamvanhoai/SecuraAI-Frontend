import { z } from "zod";
import { riskLevels } from "./risk-list-schema";

export const performResidualRiskAssessmentRequestSchema = z.strictObject({
  residualLikelihood: z.number().int().min(1).max(5),
  residualImpact: z.number().int().min(1).max(5),
  assessmentNote: z.string().trim().min(10).max(2000),
  expectedUpdatedAt: z.iso.datetime({ offset: true }),
});

export const residualRiskAssessmentResultSchema = z.object({
  riskAssessmentId: z.uuid(),
  treatmentPlanId: z.uuid(),
  riskCode: z.string(),
  title: z.string(),
  status: z.enum(["approved", "in_treatment"]),
  assessedByUserId: z.uuid(),
  assessedAt: z.iso.datetime({ offset: true }),
  inherentRisk: z.object({
    likelihood: z.number().int().min(1).max(5),
    impact: z.number().int().min(1).max(5),
    score: z.number().int().min(1).max(25),
  }),
  residualRisk: z.object({
    likelihood: z.number().int().min(1).max(5),
    impact: z.number().int().min(1).max(5),
    score: z.number().int().min(1).max(25),
    level: z.enum(riskLevels),
    reduction: z.number().int().min(0).max(24),
  }),
  updatedAt: z.iso.datetime({ offset: true }),
});

export type PerformResidualRiskAssessmentRequest = z.infer<
  typeof performResidualRiskAssessmentRequestSchema
>;
export type ResidualRiskAssessmentResult = z.infer<
  typeof residualRiskAssessmentResultSchema
>;
