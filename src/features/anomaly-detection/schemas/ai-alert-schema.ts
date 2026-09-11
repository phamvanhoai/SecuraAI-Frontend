import { z } from "zod";

export const aiAlertStatuses = [
  "new",
  "reviewing",
  "confirmed",
  "false_positive",
  "resolved",
  "dismissed",
] as const;

export const aiAlertSchema = z.object({
  id: z.uuid(),
  alertCode: z.string(),
  anomalyScore: z.number(),
  title: z.string(),
  description: z.string(),
  status: z.enum(aiAlertStatuses),
  detectedAt: z.iso.datetime(),
  asset: z
    .object({ id: z.uuid(), assetCode: z.string(), name: z.string() })
    .nullable(),
  logSource: z.object({
    id: z.uuid(),
    name: z.string(),
    sourceType: z.string(),
  }),
  model: z.object({
    id: z.uuid(),
    name: z.string(),
    version: z.string(),
    provider: z.string(),
  }),
  event: z.object({
    id: z.uuid(),
    eventType: z.string(),
    eventTime: z.iso.datetime(),
  }),
  createdAt: z.iso.datetime(),
});

export const aiAlertListSchema = z.object({
  items: z.array(aiAlertSchema),
  serverTime: z.iso.datetime(),
  pagination: z.object({
    page: z.number().int(),
    limit: z.number().int(),
    total: z.number().int(),
    totalPages: z.number().int(),
  }),
});

export type AiAlert = z.infer<typeof aiAlertSchema>;
export type AiAlertList = z.infer<typeof aiAlertListSchema>;
export type AiAlertStatus = (typeof aiAlertStatuses)[number];
