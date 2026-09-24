import { z } from "zod";

export const treatmentPlanStrategies = [
  "avoid",
  "mitigate",
  "transfer",
  "accept",
] as const;
export const treatmentPlanStatuses = [
  "draft",
  "pending_approval",
  "approved",
  "in_progress",
  "completed",
  "rejected",
  "cancelled",
] as const;

export const treatmentPlanListQuerySchema = z
  .object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(10),
    q: z.string().trim().min(1).max(100).optional(),
    status: z.enum(treatmentPlanStatuses).optional(),
    strategy: z.enum(treatmentPlanStrategies).optional(),
    ownerId: z.uuid().optional(),
    targetFrom: z.iso.date().optional(),
    targetTo: z.iso.date().optional(),
    overdue: z.enum(["true", "false"]).optional(),
    sortBy: z
      .enum([
        "riskCode",
        "strategy",
        "status",
        "targetDate",
        "createdAt",
        "updatedAt",
      ])
      .default("updatedAt"),
    sortOrder: z.enum(["asc", "desc"]).default("desc"),
  })
  .refine(
    ({ targetFrom, targetTo }) =>
      !targetFrom || !targetTo || targetFrom <= targetTo,
    { message: "From date must be on or before to date", path: ["targetTo"] },
  );

const personSchema = z
  .object({
    id: z.uuid(),
    fullName: z.string(),
    inactive: z.boolean(),
  })
  .nullable();

export const treatmentPlanListItemSchema = z.object({
  id: z.uuid(),
  risk: z.object({
    id: z.uuid(),
    riskCode: z.string(),
    title: z.string(),
    riskLevel: z.enum(["low", "medium", "high", "critical"]),
    status: z.string(),
  }),
  strategy: z.enum(treatmentPlanStrategies),
  status: z.enum(treatmentPlanStatuses),
  owner: personSchema,
  targetDate: z.iso.datetime({ offset: true }).nullable(),
  progressPercent: z.number().int().min(0).max(100).nullable(),
  completedActions: z.number().int().min(0),
  totalActions: z.number().int().min(0),
  inProgressActions: z.number().int().min(0),
  pendingActions: z.number().int().min(0),
  overdueActions: z.number().int().min(0),
  isOverdue: z.boolean(),
  createdAt: z.iso.datetime({ offset: true }),
  updatedAt: z.iso.datetime({ offset: true }),
});

export const treatmentPlanListResponseSchema = z.object({
  items: z.array(treatmentPlanListItemSchema),
  pagination: z.object({
    page: z.number().int().min(1),
    limit: z.number().int().min(1).max(100),
    total: z.number().int().min(0),
    totalPages: z.number().int().min(0),
  }),
});

export type TreatmentPlanListQuery = z.infer<
  typeof treatmentPlanListQuerySchema
>;
export type TreatmentPlanListItem = z.infer<typeof treatmentPlanListItemSchema>;
export type TreatmentPlanListResponse = z.infer<
  typeof treatmentPlanListResponseSchema
>;
