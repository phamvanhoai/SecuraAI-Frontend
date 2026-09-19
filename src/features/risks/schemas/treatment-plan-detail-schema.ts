import { z } from "zod";
import {
  treatmentPlanStatuses,
  treatmentPlanStrategies,
} from "./treatment-plan-list-schema";

const person = z
  .object({ id: z.uuid(), fullName: z.string(), inactive: z.boolean() })
  .nullable();
const dateTime = z.iso.datetime({ offset: true }).nullable();

export const treatmentPlanDetailSchema = z.object({
  id: z.uuid(),
  strategy: z.enum(treatmentPlanStrategies),
  description: z.string(),
  status: z.enum(treatmentPlanStatuses),
  owner: person,
  createdBy: person,
  targetDate: dateTime,
  submittedAt: dateTime,
  completedAt: dateTime,
  createdAt: z.iso.datetime({ offset: true }),
  updatedAt: z.iso.datetime({ offset: true }),
  progressPercent: z.number().int().min(0).max(100).nullable(),
  completedActions: z.number().int().min(0),
  totalActions: z.number().int().min(0),
  isOverdue: z.boolean(),
  risk: z.object({
    id: z.uuid(),
    riskCode: z.string(),
    title: z.string(),
    description: z.string().nullable(),
    score: z.number().int(),
    level: z.enum(["low", "medium", "high", "critical"]),
    status: z.string(),
    target: z.object({
      type: z.enum(["asset", "businessProcess"]),
      id: z.string(),
      code: z.string(),
      name: z.string(),
      deleted: z.boolean(),
    }),
  }),
  approval: z
    .object({
      id: z.uuid(),
      status: z.string(),
      currentStep: z.number().int(),
      currentStepName: z.string().nullable(),
      approverRole: z.object({ code: z.string(), name: z.string() }).nullable(),
      submissionNote: z.string().nullable(),
      submittedAt: z.iso.datetime({ offset: true }),
      completedAt: dateTime,
      submittedBy: person,
    })
    .nullable(),
  actions: z.array(
    z.object({
      id: z.uuid(),
      title: z.string(),
      description: z.string().nullable(),
      assignee: person,
      dueDate: dateTime,
      progressPercent: z.number().int().min(0).max(100),
      status: z.string(),
      completedAt: dateTime,
      createdAt: z.iso.datetime({ offset: true }),
      updatedAt: z.iso.datetime({ offset: true }),
    }),
  ),
});

export type TreatmentPlanDetail = z.infer<typeof treatmentPlanDetailSchema>;
