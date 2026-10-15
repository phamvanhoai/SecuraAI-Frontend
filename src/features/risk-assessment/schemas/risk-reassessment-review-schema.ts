import { z } from "zod";

export const riskReassessmentReviewItemSchema = z.object({
  id: z.uuid(),
  reason: z.string(),
  status: z.enum(["pending", "under_review", "completed", "rejected"]),
  requestedAt: z.iso.datetime({ offset: true }),
  reviewedAt: z.iso.datetime({ offset: true }).nullable(),
  reviewComment: z.string().nullable(),
  canReject: z.boolean(),
  risk: z.object({
    id: z.uuid(),
    riskCode: z.string(),
    title: z.string(),
    status: z.string(),
    latestInherentAssessment: z
      .object({
        likelihood: z.number().int().nullable(),
        impact: z.number().int().nullable(),
        rating: z.string().nullable(),
      })
      .nullable(),
    treatmentPlans: z.array(
      z.object({
        id: z.uuid(),
        title: z.string(),
        strategy: z.string(),
        status: z.string(),
        targetDate: z.iso.datetime({ offset: true }).nullable(),
      }),
    ),
  }),
  incident: z.object({
    id: z.uuid(),
    incidentCode: z.string(),
    title: z.string(),
    severity: z.string().nullable(),
  }),
  controlWeakness: z
    .object({
      id: z.uuid(),
      severity: z.string().nullable(),
      description: z.string(),
      status: z.string(),
      control: z.object({
        id: z.uuid(),
        controlCode: z.string(),
        name: z.string(),
      }),
    })
    .nullable(),
  requestedBy: z.object({ id: z.uuid(), fullName: z.string() }),
  reviewedBy: z.object({ id: z.uuid(), fullName: z.string() }).nullable(),
});

export const riskReassessmentReviewListSchema = z.object({
  items: z.array(riskReassessmentReviewItemSchema),
  pagination: z.object({
    page: z.number().int().min(1),
    limit: z.number().int().min(1),
    total: z.number().int().min(0),
    totalPages: z.number().int().min(0),
  }),
});

export type RiskReassessmentReviewItem = z.infer<
  typeof riskReassessmentReviewItemSchema
>;

export const completeRiskReassessmentFormSchema = z.object({
  residualLikelihood: z.number().int().min(1).max(5),
  residualImpact: z.number().int().min(1).max(5),
  controlEffectiveness: z.number().min(0).max(100),
  assessmentReason: z.string().trim().min(20).max(5000),
  treatmentPlanId: z.uuid("Select a treatment plan"),
  treatmentPlanStatus: z.enum(["draft", "active", "completed"]),
  targetDate: z.iso.date(),
});
export const completedRiskReassessmentSchema = z.object({
  requestId: z.uuid(),
  status: z.literal("completed"),
  assessmentId: z.uuid(),
  residualScore: z.number().int(),
  residualRating: z.string(),
  treatmentPlan: z.object({
    id: z.uuid(),
    title: z.string(),
    status: z.string(),
    targetDate: z.iso.datetime({ offset: true }),
  }),
  completedAt: z.iso.datetime({ offset: true }),
});
export type CompleteRiskReassessmentForm = z.infer<
  typeof completeRiskReassessmentFormSchema
>;

export const rejectRiskReassessmentFormSchema = z.object({
  reason: z
    .string()
    .trim()
    .min(20, "Explain the rejection in at least 20 characters")
    .max(2000),
});
export const rejectedRiskReassessmentSchema = z.object({
  requestId: z.uuid(),
  status: z.literal("rejected"),
  reason: z.string(),
  reviewedAt: z.iso.datetime({ offset: true }),
});
export type RejectRiskReassessmentForm = z.infer<
  typeof rejectRiskReassessmentFormSchema
>;
