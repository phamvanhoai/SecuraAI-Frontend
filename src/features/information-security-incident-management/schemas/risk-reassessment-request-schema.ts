import { z } from "zod";

const risk = z.object({
  id: z.uuid(),
  riskCode: z.string(),
  title: z.string(),
  status: z.string(),
});
const controlWeakness = z.object({
  id: z.uuid(),
  severity: z.string().nullable(),
  description: z.string(),
  status: z.string(),
  control: z.object({
    id: z.uuid(),
    controlCode: z.string(),
    name: z.string(),
  }),
});
export const riskReassessmentRequestOptionsSchema = z.object({
  incident: z.object({
    id: z.uuid(),
    incidentCode: z.string(),
    title: z.string(),
    status: z.string(),
  }),
  risks: z.array(risk.extend({ hasActiveRequest: z.boolean() })),
  controlWeaknesses: z.array(controlWeakness),
});
export const createRiskReassessmentRequestFormSchema = z.object({
  riskId: z.uuid("Select a linked risk"),
  controlFindingId: z.union([z.literal(""), z.uuid()]),
  reason: z
    .string()
    .trim()
    .min(20, "Explain the reassessment reason in at least 20 characters")
    .max(5000),
});
export const riskReassessmentRequestSchema = z.object({
  id: z.uuid(),
  reason: z.string(),
  status: z.string(),
  requestedAt: z.iso.datetime({ offset: true }),
  incident: z.object({
    id: z.uuid(),
    incidentCode: z.string(),
    title: z.string(),
  }),
  risk,
  controlWeakness: controlWeakness.nullable(),
});
const person = z.object({ id: z.uuid(), fullName: z.string() });
export const riskReassessmentRequestHistorySchema = z.object({
  incident: z.object({
    id: z.uuid(),
    incidentCode: z.string(),
    title: z.string(),
  }),
  items: z.array(
    z.object({
      id: z.uuid(),
      reason: z.string(),
      status: z.string(),
      requestedAt: z.iso.datetime({ offset: true }),
      reviewedAt: z.iso.datetime({ offset: true }).nullable(),
      reviewComment: z.string().nullable(),
      risk: risk.extend({ owner: person.nullable() }),
      controlWeakness: controlWeakness.nullable(),
      requestedBy: person,
      reviewedBy: person.nullable(),
    }),
  ),
  pagination: z.object({
    page: z.number().int().positive(),
    limit: z.number().int().positive(),
    total: z.number().int().nonnegative(),
    totalPages: z.number().int().nonnegative(),
  }),
});
export type RiskReassessmentRequestHistoryItem = z.infer<
  typeof riskReassessmentRequestHistorySchema
>["items"][number];
export type CreateRiskReassessmentRequestForm = z.infer<
  typeof createRiskReassessmentRequestFormSchema
>;
