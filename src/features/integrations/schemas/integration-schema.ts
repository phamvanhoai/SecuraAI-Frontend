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
  "disabled",
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
  // Nested relations returned by the global /logs endpoint
  integration: z
    .object({
      id: z.string(),
      name: z.string(),
      type: z.string().optional(),
      integrationType: z.string().optional(),
      status: z.string().optional(),
    })
    .optional()
    .nullable(),
  syncJob: z
    .object({
      id: z.string(),
      status: z.string(),
      recordsProcessed: z.number().optional().nullable(),
      recordsFailed: z.number().optional().nullable(),
      errorMessage: z.string().nullable().optional(),
    })
    .optional()
    .nullable(),
});
export type IntegrationLog = z.infer<typeof integrationLogSchema>;

export const integrationLogListSchema = z.object({
  items: z.array(integrationLogSchema),
  pagination: paginationSchema,
});
export type IntegrationLogList = z.infer<typeof integrationLogListSchema>;

export const apiKeyStatusEnum = z.enum(["ACTIVE", "INACTIVE", "EXPIRED"]);
export type ApiKeyStatus = z.infer<typeof apiKeyStatusEnum>;

export const integrationApiKeySchema = z.object({
  id: z.string().uuid(),
  integrationId: z.string().uuid(),
  keyName: z.string(),
  keyFingerprint: z.string().nullable().optional(),
  expiresAt: z.string().nullable().optional(),
  isActive: z.boolean(),
  status: apiKeyStatusEnum,
  createdAt: z.string(),
});
export type IntegrationApiKey = z.infer<typeof integrationApiKeySchema>;

export const integrationApiKeyListSchema = z.array(integrationApiKeySchema);
export type IntegrationApiKeyList = z.infer<typeof integrationApiKeyListSchema>;

export const createdApiKeyResponseSchema = integrationApiKeySchema.extend({
  secret: z.string(),
});
export type CreatedApiKeyResponse = z.infer<typeof createdApiKeyResponseSchema>;

export const createApiKeyFormSchema = z.object({
  keyName: z
    .string()
    .trim()
    .min(1, "Tên khóa không được để trống")
    .max(100, "Tên khóa không được vượt quá 100 ký tự"),
  secret: z
    .string()
    .trim()
    .max(1000, "Secret không được vượt quá 1000 ký tự")
    .optional()
    .or(z.literal("")),
  expiresAt: z
    .string()
    .nullable()
    .optional()
    .refine(
      (val) => !val || new Date(val).getTime() > Date.now(),
      { message: "Ngày hết hạn phải ở tương lai" },
    ),
  isActive: z.boolean().default(true),
});
export type CreateApiKeyInput = z.infer<typeof createApiKeyFormSchema>;

export const updateApiKeyFormSchema = z.object({
  keyName: z
    .string()
    .trim()
    .min(1, "Tên khóa không được để trống")
    .max(100, "Tên khóa không được vượt quá 100 ký tự")
    .optional(),
  expiresAt: z
    .string()
    .nullable()
    .optional()
    .refine(
      (val) => !val || new Date(val).getTime() > Date.now(),
      { message: "Ngày hết hạn phải ở tương lai" },
    ),
  isActive: z.boolean().optional(),
});
export type UpdateApiKeyInput = z.infer<typeof updateApiKeyFormSchema>;

export const rotateApiKeyFormSchema = z.object({
  secret: z
    .string()
    .trim()
    .max(1000, "Secret không được vượt quá 1000 ký tự")
    .optional()
    .or(z.literal("")),
});
export type RotateApiKeyInput = z.infer<typeof rotateApiKeyFormSchema>;

// -------------------------------------------------------------
// Connection Monitoring Schemas
// -------------------------------------------------------------
export const connectionLogEntrySchema = z.object({
  id: z.string().uuid(),
  integrationId: z.string().uuid(),
  integrationName: z.string().optional(),
  level: z.string(),
  message: z.string(),
  createdAt: z.string(),
  latencyMs: z.number().nullable().optional(),
  httpStatus: z.number().nullable().optional(),
  success: z.boolean().nullable().optional(),
  errorCode: z.string().nullable().optional(),
});
export type ConnectionLogEntry = z.infer<typeof connectionLogEntrySchema>;

export const failingIntegrationSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  integrationType: z.string(),
  baseUrl: z.string().nullable(),
  status: z.string(),
  lastConnectedAt: z.string().nullable(),
  lastErrorMessage: z.string().nullable(),
  lastCheckedAt: z.string().nullable(),
});
export type FailingIntegration = z.infer<typeof failingIntegrationSchema>;

export const connectionStatusSummarySchema = z.object({
  totalIntegrations: z.number(),
  activeCount: z.number(),
  errorCount: z.number(),
  inactiveCount: z.number(),
  pendingCount: z.number(),
  timeWindow: z.string(),
  checks24h: z.number(),
  successfulChecks24h: z.number(),
  failedChecks24h: z.number(),
  availability24h: z.number().nullable(),
  averageLatency24h: z.number().nullable(),
  failingIntegrations: z.array(failingIntegrationSchema),
  recentLogs: z.array(connectionLogEntrySchema),
});
export type ConnectionStatusSummary = z.infer<typeof connectionStatusSummarySchema>;

export const singleCheckProbeResultSchema = z.object({
  integrationId: z.string().uuid(),
  name: z.string(),
  connected: z.boolean(),
  statusCode: z.number().nullable().optional(),
  latencyMs: z.number(),
  message: z.string(),
});
export type SingleCheckProbeResult = z.infer<typeof singleCheckProbeResultSchema>;

export const batchConnectionCheckResultSchema = z.object({
  totalTested: z.number(),
  successful: z.number(),
  failed: z.number(),
  results: z.array(singleCheckProbeResultSchema),
});
export type BatchConnectionCheckResult = z.infer<typeof batchConnectionCheckResultSchema>;

export const integrationConnectionStatusSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  integrationType: z.string(),
  baseUrl: z.string().nullable(),
  status: z.string(),
  lastConnectedAt: z.string().nullable(),
  timeWindow: z.string(),
  checks24h: z.number(),
  successfulChecks24h: z.number(),
  failedChecks24h: z.number(),
  availability24h: z.number().nullable(),
  averageLatency24h: z.number().nullable(),
  recentLogs: z.array(connectionLogEntrySchema),
});
export type IntegrationConnectionStatus = z.infer<typeof integrationConnectionStatusSchema>;


export const integrationLogStatsSchema = z.object({
  totalErrors: z.number(),
  totalWarnings: z.number(),
  failedJobsCount: z.number(),
  affectedIntegrationsCount: z.number(),
});
export type IntegrationLogStats = z.infer<typeof integrationLogStatsSchema>;
