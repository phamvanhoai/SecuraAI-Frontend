import { z } from "zod";
import { riskDetailSchema } from "./risk-detail-schema";

export const cancelRiskAssessmentRequestSchema = z.strictObject({
  reason: z
    .string()
    .trim()
    .min(10, "Reason must be at least 10 characters.")
    .max(1000),
  expectedUpdatedAt: z.iso.datetime({ offset: true }),
});

export const cancelledRiskAssessmentSchema = riskDetailSchema;
export type CancelRiskAssessmentRequest = z.infer<
  typeof cancelRiskAssessmentRequestSchema
>;
