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

export const aiAlertFeedbackLabels = [
  "confirmed_incident",
  "false_positive",
  "needs_review",
] as const;

export const evaluateAiAlertReliabilitySchema = z.object({
  feedbackLabel: z.enum(aiAlertFeedbackLabels, {
    error: "Select a reliability assessment.",
  }),
  comment: z
    .string()
    .trim()
    .max(2000, "Comment must be 2,000 characters or fewer.")
    .optional()
    .transform((value) => value || undefined),
});

export const aiAlertFeedbackSchema = z.object({
  id: z.uuid(),
  alertId: z.uuid(),
  reviewedByUserId: z.uuid().nullable(),
  feedbackLabel: z.enum(aiAlertFeedbackLabels),
  comment: z.string().nullable(),
  createdAt: z.iso.datetime(),
});

export const aiAlertFeedbackListSchema = z.object({
  items: z.array(aiAlertFeedbackSchema),
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
export type AiAlertFeedbackLabel = (typeof aiAlertFeedbackLabels)[number];
export type EvaluateAiAlertReliabilityInput = z.input<
  typeof evaluateAiAlertReliabilitySchema
>;
export type EvaluateAiAlertReliabilityRequest = z.output<
  typeof evaluateAiAlertReliabilitySchema
>;
export type AiAlertFeedback = z.infer<typeof aiAlertFeedbackSchema>;
export type AiAlertFeedbackList = z.infer<typeof aiAlertFeedbackListSchema>;
