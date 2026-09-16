import { z } from "zod";
import { riskLevels, riskStatuses } from "./risk-list-schema";

const date = z.iso.datetime({ offset: true });
const person = z
  .object({ id: z.uuid(), fullName: z.string(), inactive: z.boolean() })
  .nullable();
const target = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("asset"),
    id: z.uuid(),
    code: z.string(),
    name: z.string(),
    status: z.string(),
    deleted: z.boolean(),
  }),
  z.object({
    type: z.literal("businessProcess"),
    id: z.uuid(),
    code: z.string(),
    name: z.string(),
    status: z.string(),
  }),
]);
const action = z.object({
  id: z.uuid(),
  title: z.string(),
  description: z.string().nullable(),
  assignee: person,
  dueDate: date.nullable(),
  progressPercent: z.number().int().min(0).max(100),
  status: z.string(),
  completedAt: date.nullable(),
});

export const riskDetailSchema = z.object({
  assessment: z.object({
    id: z.uuid(),
    riskCode: z.string(),
    title: z.string(),
    description: z.string().nullable(),
    status: z.enum(riskStatuses),
    assessedAt: date.nullable(),
    closedAt: date.nullable(),
    createdAt: date,
    updatedAt: date,
    assessedBy: person,
    cancellation: z
      .object({ reason: z.string(), cancelledAt: date, cancelledBy: person })
      .nullable(),
  }),
  target,
  inherentRisk: z.object({
    likelihood: z.number().int(),
    impact: z.number().int(),
    score: z.number().int(),
    level: z.enum(riskLevels),
  }),
  residualRisk: z
    .object({
      likelihood: z.number().int().nullable(),
      impact: z.number().int().nullable(),
      score: z.number().int(),
      level: z.enum(riskLevels),
      reduction: z.number().int(),
    })
    .nullable(),
  threats: z.array(
    z.object({
      id: z.uuid(),
      code: z.string(),
      name: z.string(),
      description: z.string().nullable(),
      category: z.string().nullable(),
      notes: z.string().nullable(),
    }),
  ),
  vulnerabilities: z.array(
    z.object({
      id: z.uuid(),
      code: z.string(),
      name: z.string(),
      description: z.string().nullable(),
      severity: z.string().nullable(),
      notes: z.string().nullable(),
    }),
  ),
  treatmentPlans: z.array(
    z.object({
      id: z.uuid(),
      strategy: z.string(),
      description: z.string(),
      owner: person,
      targetDate: date.nullable(),
      status: z.string(),
      submittedAt: date.nullable(),
      completedAt: date.nullable(),
      createdAt: date,
      updatedAt: date,
      actions: z.array(action),
    }),
  ),
  previousAssessment: z
    .object({
      id: z.uuid(),
      riskCode: z.string(),
      title: z.string(),
      score: z.number().int(),
      level: z.enum(riskLevels),
      assessedAt: date,
      assessedBy: person,
    })
    .nullable(),
});

export type RiskDetail = z.infer<typeof riskDetailSchema>;
