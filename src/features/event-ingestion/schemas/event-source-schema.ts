import { z } from "zod";

export const eventFamilies = [
  "AUTHENTICATION",
  "VPN_SSO",
  "APPLICATION_ACCESS",
] as const;

export const ingestionMethods = ["API", "FILE"] as const;
export const eventSourceStatuses = ["ACTIVE", "INACTIVE"] as const;

export const registerEventSourceFormSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(1, "Source name cannot be empty")
      .max(255, "Source name cannot exceed 255 characters"),
    sourceType: z
      .string()
      .trim()
      .min(1, "Source type cannot be empty")
      .max(100, "Source type cannot exceed 100 characters")
      .default("WAZUH"),
    endpoint: z
      .string()
      .trim()
      .max(2048, "Endpoint cannot exceed 2048 characters")
      .optional()
      .or(z.literal("")),
    ingestionMethod: z.enum(ingestionMethods).default("API"),
    authenticationType: z
      .string()
      .trim()
      .max(100, "Authentication method cannot exceed 100 characters")
      .default("BEARER_TOKEN"),
    secretToken: z
      .string()
      .trim()
      .max(255, "Secret token cannot exceed 255 characters")
      .optional()
      .or(z.literal("")),
    username: z
      .string()
      .trim()
      .max(255, "Username cannot exceed 255 characters")
      .optional()
      .or(z.literal("")),
    password: z
      .string()
      .max(255, "Password cannot exceed 255 characters")
      .optional()
      .or(z.literal("")),
    status: z.enum(eventSourceStatuses).default("ACTIVE"),
    description: z
      .string()
      .trim()
      .max(2000, "Description cannot exceed 2000 characters")
      .optional()
      .or(z.literal("")),
    eventFamilies: z
      .array(z.enum(eventFamilies))
      .min(1, "Select at least one event family"),
  })
  .refine(
    (data) => {
      if (data.ingestionMethod === "API") {
        return Boolean(data.endpoint && data.endpoint.trim().length > 0);
      }
      return true;
    },
    {
      message: "Connection endpoint is required when ingestion method is API",
      path: ["endpoint"],
    },
  );

export type RegisterEventSourceFormValues = z.infer<typeof registerEventSourceFormSchema>;

export const updateEventSourceFormSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(1, "Source name cannot be empty")
      .max(255, "Source name cannot exceed 255 characters"),
    endpoint: z
      .string()
      .trim()
      .max(2048, "Endpoint cannot exceed 2048 characters")
      .optional()
      .or(z.literal("")),
    ingestionMethod: z.enum(ingestionMethods).default("API"),
    authenticationType: z
      .string()
      .trim()
      .max(100, "Authentication method cannot exceed 100 characters")
      .optional()
      .or(z.literal("")),
    status: z.enum(eventSourceStatuses).default("ACTIVE"),
    description: z
      .string()
      .trim()
      .max(2000, "Description cannot exceed 2000 characters")
      .optional()
      .or(z.literal("")),
    eventFamilies: z
      .array(z.enum(eventFamilies))
      .min(1, "Select at least one event family"),
  })
  .refine(
    (data) => {
      if (data.ingestionMethod === "API") {
        return Boolean(data.endpoint && data.endpoint.trim().length > 0);
      }
      return true;
    },
    {
      message: "Connection endpoint is required when ingestion method is API",
      path: ["endpoint"],
    },
  );

export type UpdateEventSourceFormValues = z.infer<typeof updateEventSourceFormSchema>;

export const eventSourceResponseSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  sourceType: z.string(),
  endpoint: z.string().nullable(),
  ingestionMethod: z.enum(ingestionMethods),
  authenticationType: z.string().nullable(),
  status: z.enum(eventSourceStatuses),
  description: z.string().nullable(),
  eventFamilies: z.array(z.enum(eventFamilies)),
  createdBy: z.string().uuid(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type EventSourceResponse = z.infer<typeof eventSourceResponseSchema>;

export const eventSourceListQuerySchema = z.object({
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(20),
  q: z.string().trim().optional(),
  sourceType: z.string().trim().optional(),
  status: z.enum(eventSourceStatuses).optional(),
  sortBy: z.enum(["name", "sourceType", "status", "updatedAt", "createdAt"]).default("updatedAt"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});

export type EventSourceListQuery = z.infer<typeof eventSourceListQuerySchema>;

export const paginatedEventSourcesSchema = z.object({
  items: z.array(eventSourceResponseSchema),
  pagination: z.object({
    page: z.number(),
    limit: z.number(),
    total: z.number(),
    totalPages: z.number(),
  }),
});

export type PaginatedEventSources = z.infer<typeof paginatedEventSourcesSchema>;

export const apiKeyStatuses = ["ACTIVE", "REVOKED", "EXPIRED", "ROTATED"] as const;

export const maskedApiKeySchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  keyPrefix: z.string(),
  maskedKey: z.string(),
  status: z.enum(apiKeyStatuses),
  expiresAt: z.string().nullable(),
  lastUsedAt: z.string().nullable(),
  lastUsedIp: z.string().nullable(),
  createdAt: z.string(),
});

export type MaskedApiKey = z.infer<typeof maskedApiKeySchema>;

export const eventSourceDetailResponseSchema = eventSourceResponseSchema.extend({
  creator: z
    .object({
      id: z.string().uuid(),
      email: z.string().email(),
      fullName: z.string().nullable(),
    })
    .nullable(),
  apiKeys: z.array(maskedApiKeySchema),
  stats: z.object({
    totalIngestedEvents: z.number(),
    totalBatches: z.number(),
    lastIngestedAt: z.string().nullable(),
  }),
});

export type EventSourceDetailResponse = z.infer<typeof eventSourceDetailResponseSchema>;

export const testEventSourceConnectionSchema = z.object({
  endpoint: z
    .string()
    .trim()
    .min(1, "Endpoint cannot be empty")
    .max(2048, "Endpoint cannot exceed 2048 characters"),
  username: z.string().trim().max(255).optional().or(z.literal("")),
  password: z.string().max(255).optional().or(z.literal("")),
  verifySsl: z.boolean().default(true),
  timeoutMs: z
    .coerce
    .number()
    .int()
    .min(1000, "Timeout must be at least 1000ms")
    .max(30000, "Timeout cannot exceed 30000ms")
    .default(5000),
});

export type TestEventSourceConnectionValues = z.infer<typeof testEventSourceConnectionSchema>;

export const testEventSourceDiagnosticSchema = z.object({
  connected: z.boolean(),
  statusCode: z.number().nullable(),
  latencyMs: z.number(),
  message: z.string(),
  provider: z.string(),
  details: z
    .object({
      title: z.string().nullable(),
      apiVersion: z.string().nullable(),
      hostname: z.string().nullable(),
    })
    .nullable(),
  verifySslWarning: z.boolean(),
});

export type TestEventSourceDiagnosticResponse = z.infer<
  typeof testEventSourceDiagnosticSchema
>;

export const importEventsPayloadSchema = z.object({
  fileName: z.string().trim().max(255).optional().nullable(),
  fileFormat: z.enum(["JSON", "CSV"]).default("JSON"),
  eventFamily: z.enum(eventFamilies).optional().nullable(),
  events: z
    .array(z.record(z.string(), z.unknown()))
    .min(1, "At least one event record must be provided")
    .max(5000, "Maximum 5000 events per import"),
});

export type ImportEventsPayload = z.infer<typeof importEventsPayloadSchema>;

export const importEventsResponseSchema = z.object({
  batchId: z.string().uuid(),
  eventSourceId: z.string().uuid(),
  eventSourceName: z.string(),
  fileName: z.string().nullable(),
  fileFormat: z.string(),
  totalRecords: z.number(),
  acceptedRecords: z.number(),
  rejectedRecords: z.number(),
  status: z.enum(["COMPLETED", "PARTIALLY_COMPLETED", "FAILED"]),
  startedAt: z.string(),
  completedAt: z.string(),
  errors: z.array(
    z.object({
      recordIndex: z.number(),
      errorCode: z.string(),
      errorMessage: z.string(),
    }),
  ),
});

export type ImportEventsResponse = z.infer<typeof importEventsResponseSchema>;

