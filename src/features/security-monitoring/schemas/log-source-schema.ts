import { z } from "zod";

export const sourceTypes = [
  "application",
  "system",
  "authentication",
  "network",
  "firewall",
  "external",
] as const;
export const sourceStatuses = ["active", "inactive", "error"] as const;
export const logFormats = ["json", "syslog", "cef", "text"] as const;

export const logSourceConfigurationSchema = z.object({
  format: z.enum(logFormats),
  timezone: z.string(),
  collectRawPayload: z.boolean(),
  pollingIntervalSeconds: z.number().int().positive().max(86400).optional(),
  fieldMapping: z.record(z.string(), z.string()).optional(),
});

export const logSourceSchema = z.object({
  id: z.uuid(),
  name: z.string(),
  sourceType: z.enum(sourceTypes),
  asset: z
    .object({ id: z.uuid(), assetCode: z.string(), name: z.string() })
    .nullable(),
  integration: z
    .object({ id: z.uuid(), name: z.string(), type: z.string() })
    .nullable(),
  configuration: logSourceConfigurationSchema,
  status: z.enum(sourceStatuses),
  lastReceivedAt: z.iso.datetime().nullable(),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
});

export const logSourceListSchema = z.object({
  items: z.array(logSourceSchema),
  pagination: z.object({
    page: z.number().int(),
    limit: z.number().int(),
    total: z.number().int(),
    totalPages: z.number().int(),
  }),
});

export const logSourceFormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Name is required")
    .max(150, "Name must not exceed 150 characters"),
  sourceType: z.enum(sourceTypes),
  status: z.enum(sourceStatuses),
  format: z.enum(logFormats),
  timezone: z
    .string()
    .trim()
    .min(1, "Timezone is required")
    .max(100, "Timezone must not exceed 100 characters"),
  collectRawPayload: z.boolean(),
  pollingIntervalSeconds: z.coerce
    .number()
    .int("Polling interval must be a whole number")
    .min(1, "Polling interval must be at least 1 second")
    .max(86400, "Polling interval must not exceed 86,400 seconds")
    .optional(),
});

export type LogSource = z.infer<typeof logSourceSchema>;
export type LogSourceList = z.infer<typeof logSourceListSchema>;
export type LogSourceForm = z.infer<typeof logSourceFormSchema>;
