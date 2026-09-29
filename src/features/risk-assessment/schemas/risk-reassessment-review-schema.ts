import { z } from "zod";

export const riskReassessmentReviewItemSchema = z.object({
  id: z.uuid(),
  reason: z.string(),
  status: z.enum(["pending", "under_review", "completed", "rejected"]),
  requestedAt: z.iso.datetime({ offset: true }),
  reviewedAt: z.iso.datetime({ offset: true }).nullable(),
  risk: z.object({
    id: z.uuid(),
    riskCode: z.string(),
    title: z.string(),
    status: z.string(),
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
      control: z.object({ id: z.uuid(), controlCode: z.string(), name: z.string() }),
    })
    .nullable(),
  requestedBy: z.object({ id: z.uuid(), fullName: z.string() }),
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

export type RiskReassessmentReviewItem = z.infer<typeof riskReassessmentReviewItemSchema>;
