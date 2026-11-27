import { z } from "zod";

export const anomalyDetectionRunInputSchema = z.object({
  maxEvents: z.number().int().min(1).max(500),
});

export const anomalyDetectionRunResultSchema = z.object({
  modelVersionId: z.string().uuid(),
  modelName: z.string(),
  modelVersion: z.string(),
  scope: z.literal("ALL_PENDING"),
  hasMore: z.boolean().default(false),
  eventsEvaluated: z.number().int().nonnegative(),
  insufficientBaseline: z.number().int().nonnegative().default(0),
  anomaliesDetected: z.number().int().nonnegative(),
  detectionsCreated: z.number().int().nonnegative(),
  alertsCreated: z.number().int().nonnegative(),
  alertsGrouped: z.number().int().nonnegative().default(0),
  threshold: z.number().min(0).max(1),
  completedAt: z.iso.datetime(),
});

export type AnomalyDetectionRunInput = z.infer<
  typeof anomalyDetectionRunInputSchema
>;
export type AnomalyDetectionRunResult = z.infer<
  typeof anomalyDetectionRunResultSchema
>;
