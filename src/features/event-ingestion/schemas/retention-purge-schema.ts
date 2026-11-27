import { z } from "zod";
import { governanceEventFamilies } from "./event-governance-schema";

export const effectiveRetentionReasons = [
  "ACTIVE_POLICY",
  "DELETION_DISABLED",
  "NO_ACTIVE_POLICY",
] as const;
export type EffectiveRetentionReason = (typeof effectiveRetentionReasons)[number];

export const retentionPurgeRunStatuses = [
  "COMPLETED",
  "DRY_RUN",
  "SKIPPED_LOCKED",
] as const;
export type RetentionPurgeRunStatus = (typeof retentionPurgeRunStatuses)[number];

export const retentionPurgeTriggers = ["SCHEDULED", "MANUAL"] as const;
export type RetentionPurgeTrigger = (typeof retentionPurgeTriggers)[number];

export const runRetentionPurgePayloadSchema = z
  .object({
    dryRun: z.boolean().default(false),
    eventFamily: z.enum(governanceEventFamilies).optional(),
    batchSize: z
      .number()
      .int("Batch size must be a whole number")
      .min(10, "Batch size must be at least 10")
      .max(1000, "Batch size cannot exceed 1000")
      .optional(),
    maxBatches: z
      .number()
      .int("Max batches must be a whole number")
      .min(1, "Max batches must be at least 1")
      .max(100, "Max batches cannot exceed 100")
      .optional(),
  })
  .strict();

export type RunRetentionPurgePayload = z.infer<typeof runRetentionPurgePayloadSchema>;

export type RunRetentionPurgeInput = {
  dryRun?: boolean | undefined;
  eventFamily?: (typeof governanceEventFamilies)[number] | undefined;
  batchSize?: number | undefined;
  maxBatches?: number | undefined;
};

export const effectiveFamilyRetentionPolicySchema = z.object({
  eventFamily: z.enum(governanceEventFamilies),
  eligible: z.boolean(),
  reason: z.enum(effectiveRetentionReasons),
  retentionDays: z.number().int().positive().nullable(),
  cutoffDate: z.string().nullable(),
  policyIds: z.array(z.string()),
  policyNames: z.array(z.string()),
});

export type EffectiveFamilyRetentionPolicy = z.infer<
  typeof effectiveFamilyRetentionPolicySchema
>;

export const retentionPurgeFamilyResultSchema = z.object({
  eventFamily: z.enum(governanceEventFamilies),
  eligible: z.boolean(),
  reason: z.enum(effectiveRetentionReasons),
  retentionDays: z.number().int().positive().nullable(),
  cutoffDate: z.string().nullable(),
  policyIds: z.array(z.string()),
  batchesExecuted: z.number().int().min(0),
  deletedNormalizedEvents: z.number().int().min(0),
  deletedDetections: z.number().int().min(0),
  deletedFeatureContributions: z.number().int().min(0),
  deletedMappings: z.number().int().min(0),
  deletedDetectionJobs: z.number().int().min(0),
  deletedInvalidEvents: z.number().int().min(0),
  protectedByAlertOrIncident: z.number().int().min(0),
  hasMore: z.boolean(),
});

export type RetentionPurgeFamilyResult = z.infer<
  typeof retentionPurgeFamilyResultSchema
>;

export const retentionPurgeRunResultSchema = z.object({
  status: z.enum(retentionPurgeRunStatuses),
  trigger: z.enum(retentionPurgeTriggers),
  dryRun: z.boolean(),
  startedAt: z.string(),
  completedAt: z.string(),
  durationMs: z.number().int().min(0),
  totalDeletedNormalizedEvents: z.number().int().min(0),
  totalDeletedInvalidEvents: z.number().int().min(0),
  totalProtectedEvents: z.number().int().min(0),
  families: z.array(retentionPurgeFamilyResultSchema),
});

export type RetentionPurgeRunResult = z.infer<typeof retentionPurgeRunResultSchema>;

export const retentionPurgeHistoryItemSchema = z.object({
  id: z.string().uuid(),
  occurredAt: z.string(),
  actorType: z.string(),
  actorUserId: z.string().nullable(),
  source: z.string().nullable(),
  outcome: z.string(),
  summary: z.record(z.string(), z.unknown()).nullable(),
});

export type RetentionPurgeHistoryItem = z.infer<typeof retentionPurgeHistoryItemSchema>;

export const retentionPurgeStatusSchema = z.object({
  enabled: z.boolean(),
  workerActive: z.boolean(),
  running: z.boolean(),
  intervalMs: z.number().int().positive(),
  batchSize: z.number().int().positive(),
  maxBatchesPerRun: z.number().int().positive(),
  runOnStartup: z.boolean(),
  effectivePolicies: z.array(effectiveFamilyRetentionPolicySchema),
  lastRun: retentionPurgeRunResultSchema.nullable(),
  recentRuns: z.array(retentionPurgeHistoryItemSchema),
});

export type RetentionPurgeStatus = z.infer<typeof retentionPurgeStatusSchema>;
