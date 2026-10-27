import { z } from "zod";
import { acceptanceCostSchema } from "./acceptance-cost-schema";

export const riskRegisterStatuses = [
  "open",
  "under_treatment",
  "accepted",
  "closed",
  "archived",
] as const;
export const riskRatings = ["low", "medium", "high", "critical"] as const;
export const riskRegisterQuerySchema = z
  .object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(10),
    q: z.string().trim().min(1).max(100).optional(),
    status: z.enum(riskRegisterStatuses).optional(),
    riskRating: z.enum(riskRatings).optional(),
    reviewFrom: z.iso.date().optional(),
    reviewTo: z.iso.date().optional(),
    sortBy: z
      .enum(["riskCode", "title", "reviewDate", "updatedAt"])
      .default("updatedAt"),
    sortOrder: z.enum(["asc", "desc"]).default("desc"),
  })
  .refine(
    ({ reviewFrom, reviewTo }) =>
      !reviewFrom || !reviewTo || reviewFrom <= reviewTo,
    { path: ["reviewTo"], message: "From date must be on or before to date" },
  );

const person = z
  .object({ id: z.uuid(), fullName: z.string(), inactive: z.boolean() })
  .nullable();
const auditActor = z.object({
  id: z.uuid(),
  fullName: z.string(),
  email: z.email(),
});
const asset = z.object({
  id: z.uuid(),
  code: z.string(),
  name: z.string(),
  status: z.string(),
  criticality: z.string().nullable(),
});
const assessment = z.object({
  id: z.uuid(),
  type: z.string(),
  inherentLikelihood: z.number().int().nullable(),
  inherentImpact: z.number().int().nullable(),
  inherentRating: z.enum(riskRatings).nullable(),
  residualLikelihood: z.number().int().nullable(),
  residualImpact: z.number().int().nullable(),
  residualRating: z.enum(riskRatings).nullable(),
  controlEffectiveness: z.number().nullable(),
  targetRisk: z.enum(riskRatings).nullable(),
  riskAppetite: z.enum(riskRatings).nullable(),
  riskTolerance: z.enum(riskRatings).nullable(),
  reason: z.string().nullable(),
  assessedBy: person,
  assessedAt: z.iso.datetime({ offset: true }),
  reviewDate: z.iso.datetime({ offset: true }).nullable(),
  methodologyVersion: z.string(),
});
export const riskRegisterItemSchema = z.object({
  scope: z
    .discriminatedUnion("type", [
      z.object({ type: z.literal("asset") }),
      z.object({
        type: z.literal("business_service"),
        businessService: z.object({
          id: z.uuid(),
          name: z.string(),
          status: z.string(),
        }),
      }),
    ])
    .nullable()
    .optional(),
  id: z.uuid(),
  riskCode: z.string(),
  title: z.string(),
  description: z.string().nullable(),
  status: z.enum(riskRegisterStatuses),
  owner: person,
  reviewDate: z.iso.datetime({ offset: true }).nullable(),
  assets: z.array(asset),
  latestAssessment: assessment.nullable(),
  linkedCounts: z.object({
    controls: z.number().int().min(0),
    treatmentPlans: z.number().int().min(0),
    incidents: z.number().int().min(0),
  }),
  activeTreatmentPlan: z
    .object({
      id: z.uuid(),
      title: z.string(),
      status: z.enum(["draft", "active"]),
    })
    .nullable(),
  createdAt: z.iso.datetime({ offset: true }),
  updatedAt: z.iso.datetime({ offset: true }),
});
export const riskRegisterResponseSchema = z.object({
  items: z.array(riskRegisterItemSchema),
  pagination: z.object({
    page: z.number().int(),
    limit: z.number().int(),
    total: z.number().int(),
    totalPages: z.number().int(),
  }),
});
export const riskRegisterDetailSchema = riskRegisterItemSchema.extend({
  assetClassificationReviewRequired: z.boolean().optional(),
  assetContextReviewRequired: z.boolean().optional(),
  acceptanceWorkflow: z
    .object({
      canSubmit: z.boolean(),
      blockedReason: z.string().nullable(),
      canOpenReview: z.boolean(),
    })
    .optional(),
  targetHistory: z
    .array(
      z.object({
        assessmentId: z.string(),
        treatmentPlanId: z.string().nullable(),
        treatmentPlanTitle: z.string().nullable(),
        residualAssessmentId: z.string().nullable(),
        residualAssessedAt: z.string().nullable(),
        residualRating: z.string().nullable(),
      }),
    )
    .default([]),
  vulnerabilityWorkflow: z
    .object({
      canIdentify: z.boolean(),
      blockedReason: z.string().nullable(),
      assessmentReviewRequired: z.boolean(),
    })
    .optional(),
  createdBy: person,
  assessments: z.array(assessment),
  threats: z.array(
    z.object({
      id: z.uuid(),
      name: z.string(),
      description: z.string().nullable(),
      vulnerabilities: z
        .array(z.object({ id: z.uuid(), name: z.string() }))
        .default([]),
      createdAt: z.iso.datetime({ offset: true }),
      updatedAt: z.iso.datetime({ offset: true }),
    }),
  ),
  contextHistory: z
    .array(
      z.object({
        id: z.uuid(),
        type: z.enum(["threat", "vulnerability"]),
        event: z.enum(["created", "updated"]),
        entityId: z.uuid().nullable(),
        occurredAt: z.iso.datetime({ offset: true }),
        actor: auditActor.nullable(),
        before: z.unknown().nullable(),
        after: z.unknown().nullable(),
      }),
    )
    .default([]),
  vulnerabilities: z.array(
    z.object({
      id: z.uuid(),
      name: z.string(),
      description: z.string().nullable(),
      createdAt: z.iso.datetime({ offset: true }).optional(),
      updatedAt: z.iso.datetime({ offset: true }),
      controls: z
        .array(z.object({ id: z.uuid(), code: z.string(), name: z.string() }))
        .default([]),
    }),
  ),
  controls: z.array(
    z.object({
      id: z.uuid(),
      code: z.string(),
      name: z.string(),
      applicability: z.string(),
      implementationStatus: z.string(),
      latestEffectiveness: z.number().nullable(),
      latestResult: z.string().nullable(),
    }),
  ),
  treatmentPlans: z.array(
    z.object({
      id: z.uuid(),
      riskId: z.uuid(),
      title: z.string(),
      strategy: z.string(),
      status: z.string(),
      owner: person,
      targetCompletionDate: z.iso.datetime({ offset: true }).nullable(),
      acceptanceCost: acceptanceCostSchema.nullish(),
      actionCount: z.number().int(),
      progress: z.number().int().min(0).max(100),
      updatedAt: z.iso.datetime({ offset: true }),
      controls: z
        .array(z.object({ id: z.uuid(), code: z.string(), name: z.string() }))
        .default([]),
      actions: z.array(
        z.object({
          id: z.uuid(),
          title: z.string(),
          assignedToUserId: z.uuid().nullable(),
          status: z.enum(["pending", "in_progress", "completed", "cancelled"]),
          dueDate: z.iso.datetime({ offset: true }).nullable(),
        }),
      ),
    }),
  ),
  incidents: z.array(
    z.object({
      id: z.uuid(),
      code: z.string(),
      title: z.string(),
      severity: z.string(),
      status: z.string(),
      createdAt: z.iso.datetime({ offset: true }),
    }),
  ),
  acceptances: z.array(
    z.object({
      id: z.uuid(),
      decision: z.enum(["pending", "approved", "rejected"]),
      reason: z.string().nullable(),
      requestedAt: z.iso.datetime({ offset: true }),
      validUntil: z.iso.datetime({ offset: true }).nullable(),
      requestedBy: z.uuid(),
      decidedBy: z.uuid().nullable(),
      decidedAt: z.iso.datetime({ offset: true }).nullable(),
      acceptanceCost: acceptanceCostSchema.nullish(),
      requestReason: z.string().nullable().optional(),
      decisionReason: z.string().nullable().optional(),
      expired: z.boolean().default(false),
      canDecide: z.boolean().default(false),
      approvalBlockedReason: z.string().nullable().optional(),
      historical: z.boolean().optional(),
    }),
  ),
});
export type RiskRegisterQuery = z.infer<typeof riskRegisterQuerySchema>;
export type RiskRegisterItem = z.infer<typeof riskRegisterItemSchema>;
export type RiskRegisterResponse = z.infer<typeof riskRegisterResponseSchema>;
export type RiskRegisterDetail = z.infer<typeof riskRegisterDetailSchema>;
