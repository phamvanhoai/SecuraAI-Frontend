import { z } from "zod";

export const governancePolicyStatuses = ["ACTIVE", "INACTIVE"] as const;
export type GovernancePolicyStatus = (typeof governancePolicyStatuses)[number];

export const governanceEventFamilies = [
  "AUTHENTICATION",
  "VPN_SSO",
  "APPLICATION_ACCESS",
] as const;
export type GovernanceEventFamily = (typeof governanceEventFamilies)[number];

export const userSummarySchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  email: z.string().email(),
});

export type UserSummary = z.infer<typeof userSummarySchema>;

export const eventGovernancePolicySchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1),
  purpose: z.string(),
  eventFamily: z.enum(governanceEventFamilies).nullable(),
  retentionDays: z.number().int().positive(),
  accessScope: z.string().nullable(),
  maskingRules: z.record(z.string(), z.unknown()).nullable(),
  exportAllowed: z.boolean(),
  archiveAfterDays: z.number().int().positive().nullable(),
  deletionEnabled: z.boolean(),
  status: z.enum(governancePolicyStatuses),
  createdBy: userSummarySchema.nullable(),
  updatedBy: userSummarySchema.nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type EventGovernancePolicy = z.infer<typeof eventGovernancePolicySchema>;

export const paginatedEventGovernancePoliciesSchema = z.object({
  items: z.array(eventGovernancePolicySchema),
  pagination: z.object({
    page: z.number().int().min(1),
    limit: z.number().int().min(1),
    totalItems: z.number().int().min(0),
    totalPages: z.number().int().min(0),
  }),
});

export type PaginatedEventGovernancePolicies = z.infer<
  typeof paginatedEventGovernancePoliciesSchema
>;

export const eventGovernanceLifecycleSummarySchema = z.object({
  totalPolicies: z.number().int().min(0),
  activePolicies: z.number().int().min(0),
  inactivePolicies: z.number().int().min(0),
  minRetentionDays: z.number().int().min(0),
  maxRetentionDays: z.number().int().min(0),
  avgRetentionDays: z.number().int().min(0),
  policiesWithArchival: z.number().int().min(0),
  policiesWithAutomatedDeletion: z.number().int().min(0),
  exportAllowedCount: z.number().int().min(0),
});

export type EventGovernanceLifecycleSummary = z.infer<
  typeof eventGovernanceLifecycleSummarySchema
>;

export const listEventGovernancePoliciesParamsSchema = z.object({
  page: z.number().int().min(1).optional(),
  limit: z.number().int().min(1).max(100).optional(),
  search: z.string().trim().optional(),
  eventFamily: z.enum(governanceEventFamilies).optional(),
  status: z.enum(governancePolicyStatuses).optional(),
  sortBy: z
    .enum(["name", "retentionDays", "archiveAfterDays", "status", "createdAt", "updatedAt"])
    .optional(),
  sortOrder: z.enum(["asc", "desc"]).optional(),
});

export type ListEventGovernancePoliciesParams = z.infer<
  typeof listEventGovernancePoliciesParamsSchema
>;

export const updateEventGovernancePolicySchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(3, "Policy name must be at least 3 characters")
      .max(150, "Policy name cannot exceed 150 characters")
      .optional(),
    purpose: z
      .string()
      .trim()
      .min(5, "Purpose must be at least 5 characters")
      .max(500, "Purpose cannot exceed 500 characters")
      .optional(),
    eventFamily: z.enum(governanceEventFamilies).nullable().optional(),
    retentionDays: z
      .number()
      .int()
      .min(1, "Retention period must be at least 1 day")
      .max(3650, "Retention period cannot exceed 3650 days (10 years)")
      .optional(),
    archiveAfterDays: z
      .number()
      .int()
      .min(1, "Archival threshold must be at least 1 day")
      .max(3650)
      .nullable()
      .optional(),
    accessScope: z.string().trim().max(100).nullable().optional(),
    maskingRules: z.record(z.string(), z.unknown()).nullable().optional(),
    exportAllowed: z.boolean().optional(),
    deletionEnabled: z.boolean().optional(),
    status: z.enum(governancePolicyStatuses).optional(),
  })
  .refine(
    (data) => {
      if (
        data.archiveAfterDays !== undefined &&
        data.archiveAfterDays !== null &&
        data.retentionDays !== undefined
      ) {
        return data.archiveAfterDays < data.retentionDays;
      }
      return true;
    },
    {
      message:
        "Cold archival threshold (archiveAfterDays) must be strictly less than retention period (retentionDays)",
      path: ["archiveAfterDays"],
    },
  );

export type UpdateEventGovernancePolicyForm = z.infer<
  typeof updateEventGovernancePolicySchema
>;
