import { z } from "zod";

export const riskLevels = ["low", "medium", "high", "critical"] as const;
export const riskStatuses = [
  "draft",
  "pending_approval",
  "approved",
  "in_treatment",
  "closed",
  "rejected",
  "cancelled",
] as const;

export const riskListQuerySchema = z
  .object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(10),
    q: z.string().trim().min(1).max(100).optional(),
    riskLevel: z.enum(riskLevels).optional(),
    status: z.enum(riskStatuses).optional(),
    targetType: z.enum(["asset", "business_process"]).optional(),
    assessedFrom: z.iso.date().optional(),
    assessedTo: z.iso.date().optional(),
    hasTreatmentPlan: z.enum(["true", "false"]).optional(),
    sortBy: z
      .enum([
        "riskCode",
        "title",
        "riskScore",
        "riskLevel",
        "assessedAt",
        "updatedAt",
      ])
      .default("updatedAt"),
    sortOrder: z.enum(["asc", "desc"]).default("desc"),
  })
  .refine(
    ({ assessedFrom, assessedTo }) =>
      !assessedFrom || !assessedTo || assessedFrom <= assessedTo,
    {
      message: "From date must be on or before to date",
      path: ["assessedTo"],
    },
  );

const target = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("asset"),
    id: z.uuid(),
    code: z.string(),
    name: z.string(),
    deleted: z.boolean(),
  }),
  z.object({
    type: z.literal("businessProcess"),
    id: z.uuid(),
    code: z.string(),
    name: z.string(),
  }),
]);
export const riskListItemSchema = z.object({
  id: z.uuid(),
  riskCode: z.string(),
  title: z.string(),
  likelihood: z.number().int().min(1).max(5),
  impact: z.number().int().min(1).max(5),
  riskScore: z.number().int().min(1).max(25),
  riskLevel: z.enum(riskLevels),
  status: z.enum(riskStatuses),
  target,
  assessedBy: z
    .object({ id: z.uuid(), fullName: z.string(), deleted: z.boolean() })
    .nullable(),
  hasTreatmentPlan: z.boolean(),
  assessedAt: z.iso.datetime({ offset: true }).nullable(),
  updatedAt: z.iso.datetime({ offset: true }),
});
export const riskListResponseSchema = z.object({
  items: z.array(riskListItemSchema),
  pagination: z.object({
    page: z.number().int().min(1),
    limit: z.number().int().min(1).max(100),
    total: z.number().int().min(0),
    totalPages: z.number().int().min(0),
  }),
});
export type RiskListQuery = z.infer<typeof riskListQuerySchema>;
export type RiskListItem = z.infer<typeof riskListItemSchema>;
export type RiskListResponse = z.infer<typeof riskListResponseSchema>;
