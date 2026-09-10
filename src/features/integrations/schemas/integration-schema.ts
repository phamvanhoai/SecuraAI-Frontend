import { z } from "zod";

export const integrationTypeEnum = z.enum([
  "siem",
  "firewall",
  "log_source",
  "api",
]);
export type IntegrationType = z.infer<typeof integrationTypeEnum>;

export const integrationStatusEnum = z.enum([
  "active",
  "inactive",
  "error",
  "pending",
]);
export type IntegrationStatus = z.infer<typeof integrationStatusEnum>;

export const paginationSchema = z.object({
  total: z.number(),
  page: z.number(),
  limit: z.number(),
  totalPages: z.number(),
});

export const integrationSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  integrationType: integrationTypeEnum,
  baseUrl: z.string().nullable(),
  configuration: z.unknown().optional(),
  status: integrationStatusEnum,
  lastConnectedAt: z.string().nullable(),
  createdByUserId: z.string().nullable().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type Integration = z.infer<typeof integrationSchema>;

export const integrationListSchema = z.object({
  items: z.array(integrationSchema),
  pagination: paginationSchema,
});
export type IntegrationList = z.infer<typeof integrationListSchema>;

export const createIntegrationFormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Tên kết nối không được để trống")
    .max(150, "Tên kết nối không được vượt quá 150 ký tự"),
  integrationType: integrationTypeEnum,
  baseUrl: z
    .string()
    .trim()
    .url("Định dạng URL không hợp lệ (ví dụ: https://siem.enterprise.local)")
    .or(z.literal(""))
    .optional()
    .transform((val) => (val && val.length > 0 ? val : null)),
  configuration: z.record(z.string(), z.unknown()).optional().nullable(),
});
export type CreateIntegrationInput = z.infer<typeof createIntegrationFormSchema>;

export const updateIntegrationFormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Tên kết nối không được để trống")
    .max(150, "Tên kết nối không được vượt quá 150 ký tự")
    .optional(),
  baseUrl: z
    .string()
    .trim()
    .url("Định dạng URL không hợp lệ")
    .or(z.literal(""))
    .optional()
    .nullable()
    .transform((val) => (val && val.length > 0 ? val : null)),
  status: integrationStatusEnum.optional(),
  configuration: z.record(z.string(), z.unknown()).optional().nullable(),
});
export type UpdateIntegrationInput = z.infer<typeof updateIntegrationFormSchema>;

export const testConnectionResultSchema = z
  .object({
    connected: z.boolean().optional(),
    success: z.boolean().optional(),
    statusCode: z.number().nullable().optional(),
    latencyMs: z.number(),
    message: z.string(),
    checkedAt: z.string().optional(),
  })
  .transform((data) => ({
    ...data,
    connected: data.connected ?? data.success ?? true,
    success: data.success ?? data.connected ?? true,
    checkedAt: data.checkedAt || new Date().toISOString(),
  }));
export type TestConnectionResult = z.infer<typeof testConnectionResultSchema>;

export const syncScheduleSchema = z.object({
  id: z.string().uuid(),
  integrationId: z.string().uuid(),
  scheduleExpression: z.string(),
  isActive: z.boolean(),
  lastRunAt: z.string().nullable(),
  nextRunAt: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type SyncSchedule = z.infer<typeof syncScheduleSchema>;

export const syncScheduleListSchema = z.array(syncScheduleSchema);
export type SyncScheduleList = z.infer<typeof syncScheduleListSchema>;

export const createSyncScheduleFormSchema = z.object({
  scheduleExpression: z
    .string()
    .trim()
    .min(1, "Cron expression không được để trống")
    .max(100, "Cron expression quá dài"),
  isActive: z.boolean().default(true),
});
export type CreateSyncScheduleInput = z.infer<typeof createSyncScheduleFormSchema>;

export const updateSyncScheduleFormSchema = z.object({
  scheduleExpression: z
    .string()
    .trim()
    .min(1, "Cron expression không được để trống")
    .max(100, "Cron expression quá dài")
    .optional(),
  isActive: z.boolean().optional(),
});
export type UpdateSyncScheduleInput = z.infer<typeof updateSyncScheduleFormSchema>;

export const syncJobSchema = z.object({
  id: z.string().uuid(),
  integrationId: z.string().uuid(),
  syncScheduleId: z.string().uuid().nullable().optional(),
  status: z.string(),
  recordsProcessed: z.number(),
  recordsFailed: z.number(),
  startedAt: z.string().nullable(),
  completedAt: z.string().nullable(),
  errorMessage: z.string().nullable(),
  createdAt: z.string(),
});
export type SyncJob = z.infer<typeof syncJobSchema>;

export const syncJobListSchema = z.object({
  items: z.array(syncJobSchema),
  pagination: paginationSchema,
});
export type SyncJobList = z.infer<typeof syncJobListSchema>;

export const integrationLogSchema = z.object({
  id: z.string().uuid(),
  integrationId: z.string().uuid(),
  syncJobId: z.string().uuid().nullable().optional(),
  level: z.string(),
  message: z.string(),
  details: z.unknown().optional(),
  createdAt: z.string(),
});
export type IntegrationLog = z.infer<typeof integrationLogSchema>;

export const integrationLogListSchema = z.object({
  items: z.array(integrationLogSchema),
  pagination: paginationSchema,
});
export type IntegrationLogList = z.infer<typeof integrationLogListSchema>;
