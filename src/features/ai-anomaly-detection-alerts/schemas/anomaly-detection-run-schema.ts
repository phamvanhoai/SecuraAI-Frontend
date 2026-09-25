import { z } from "zod";

export const anomalyDetectionRunInputSchema = z.object({
  lookbackHours: z.number().int().min(1).max(720),
  maxEvents: z.number().int().min(1).max(500),
});

export const anomalyDetectionRunResultSchema = z.object({
  modelVersionId: z.string().uuid(),
  modelName: z.string(),
  modelVersion: z.string(),
  lookbackHours: z.number().int(),
  eventsEvaluated: z.number().int().nonnegative(),
  anomaliesDetected: z.number().int().nonnegative(),
  detectionsCreated: z.number().int().nonnegative(),
  alertsCreated: z.number().int().nonnegative(),
  threshold: z.number().min(0).max(1),
  completedAt: z.iso.datetime(),
});

export type AnomalyDetectionRunInput = z.infer<
  typeof anomalyDetectionRunInputSchema
>;
export type AnomalyDetectionRunResult = z.infer<
  typeof anomalyDetectionRunResultSchema
>;
