import { z } from "zod";

export const WORKFLOW_ENTITY_TYPES = [
  "risk_treatment_plan",
  "policy_version",
  "incident_report",
  "access_request",
] as const;

export type WorkflowEntityType = (typeof WORKFLOW_ENTITY_TYPES)[number];

export const WORKFLOW_ENTITY_LABELS: Record<WorkflowEntityType, string> = {
  risk_treatment_plan: "Kế hoạch xử lý rủi ro",
  policy_version: "Phiên bản chính sách",
  incident_report: "Báo cáo sự cố",
  access_request: "Yêu cầu cấp quyền",
};

export const workflowCreatorSchema = z.object({
  userId: z.string().min(1),
  name: z.string(),
  email: z.string().email(),
});

export type WorkflowCreator = z.infer<typeof workflowCreatorSchema>;

export const workflowDefinitionItemSchema = z.object({
  workflowId: z.string().min(1),
  name: z.string(),
  description: z.string().nullable(),
  entityType: z.enum(WORKFLOW_ENTITY_TYPES),
  isActive: z.boolean(),
  stepsCount: z.number().int().nonnegative(),
  createdBy: workflowCreatorSchema.nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type WorkflowDefinitionItem = z.infer<typeof workflowDefinitionItemSchema>;

export const workflowPaginationSchema = z.object({
  page: z.number().int().min(1),
  limit: z.number().int().min(1),
  total: z.number().int().nonnegative(),
  totalPages: z.number().int().nonnegative(),
});

export type WorkflowPagination = z.infer<typeof workflowPaginationSchema>;

export const workflowSummarySchema = z.object({
  total: z.number().int().nonnegative(),
  active: z.number().int().nonnegative(),
  inactive: z.number().int().nonnegative(),
});

export type WorkflowSummary = z.infer<typeof workflowSummarySchema>;

export const workflowListResponseSchema = z.object({
  items: z.array(workflowDefinitionItemSchema),
  pagination: workflowPaginationSchema,
  summary: workflowSummarySchema,
});

export type WorkflowListResponse = z.infer<typeof workflowListResponseSchema>;

export const queryWorkflowDefinitionsSchema = z.object({
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(10),
  search: z.string().optional(),
  entityType: z.enum(WORKFLOW_ENTITY_TYPES).optional(),
  isActive: z.boolean().optional(),
  sortBy: z.enum(["name", "entityType", "createdAt", "updatedAt", "isActive"]).default("updatedAt"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});

export type QueryWorkflowDefinitionsInput = z.input<typeof queryWorkflowDefinitionsSchema>;
export type QueryWorkflowDefinitionsOutput = z.infer<typeof queryWorkflowDefinitionsSchema>;
