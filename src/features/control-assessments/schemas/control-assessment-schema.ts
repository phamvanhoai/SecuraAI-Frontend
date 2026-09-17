import { z } from "zod";

export const complianceStatusSchema = z.enum(["compliant", "partially_compliant", "non_compliant", "not_assessed"]);
const assessmentSchema = z.object({
  id: z.uuid(), complianceStatus: complianceStatusSchema, score: z.number().nullable(), notes: z.string().nullable(),
  assessedAt: z.string(), nextReviewAt: z.string().nullable(),
  assessor: z.object({ id: z.uuid(), name: z.string(), email: z.string() }).nullable(),
  evidenceCount: z.number().int().nonnegative(),
});
const frameworkSchema = z.object({ id: z.uuid(), code: z.string(), name: z.string(), version: z.string().nullable() });
export const controlAssessmentListSchema = z.object({
  items: z.array(z.object({ id: z.uuid(), controlCode: z.string(), title: z.string(), description: z.string().nullable(), framework: frameworkSchema, latestAssessment: assessmentSchema.nullable(), mappedPolicies: z.array(z.object({ id: z.uuid(), policyCode: z.string(), title: z.string(), versionId: z.uuid(), versionNumber: z.string(), versionStatus: z.string() })), mappedPolicyCount: z.number() })),
  frameworks: z.array(frameworkSchema),
  summary: z.object({ compliant: z.number(), partiallyCompliant: z.number(), nonCompliant: z.number(), notAssessed: z.number(), overdue: z.number() }),
  pagination: z.object({ page: z.number(), limit: z.number(), total: z.number(), totalPages: z.number() }),
  resultsTruncated: z.boolean(),
});
export const assessmentHistorySchema = z.object({ control: z.object({ id: z.uuid(), controlCode: z.string(), title: z.string() }), items: z.array(assessmentSchema) });
export const createAssessmentSchema = z.object({
  complianceStatus: complianceStatusSchema,
  score: z.number().min(0).max(100).nullable().optional(),
  notes: z.string().trim().max(5000).nullable().optional(),
  nextReviewAt: z.string().datetime({ offset: true }).nullable().optional(),
});
export type ControlAssessmentList = z.infer<typeof controlAssessmentListSchema>;
export type ControlAssessmentItem = ControlAssessmentList["items"][number];
export type AssessmentHistory = z.infer<typeof assessmentHistorySchema>;
export type CreateAssessment = z.infer<typeof createAssessmentSchema>;
