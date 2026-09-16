import { z } from "zod";

export const submitTreatmentPlanRequestSchema = z.strictObject({
  expectedUpdatedAt: z.iso.datetime({ offset: true }),
  submissionNote: z
    .string()
    .transform((value) => value.normalize("NFKC").replace(/\s+/gu, " ").trim())
    .pipe(z.string().max(1000))
    .optional(),
});

export const submittedTreatmentPlanSchema = z.object({
  treatmentPlanId: z.uuid(),
  riskAssessmentId: z.uuid(),
  status: z.literal("pending_approval"),
  submittedAt: z.iso.datetime({ offset: true }),
  approvalRequestId: z.uuid(),
  approvalStatus: z.literal("pending"),
  currentStep: z.number().int().positive(),
});

export type SubmitTreatmentPlanRequest = z.infer<
  typeof submitTreatmentPlanRequestSchema
>;
export type SubmittedTreatmentPlan = z.infer<
  typeof submittedTreatmentPlanSchema
>;
