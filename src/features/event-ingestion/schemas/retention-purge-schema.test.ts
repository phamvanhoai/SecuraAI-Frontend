import { describe, expect, it } from "vitest";
import {
  retentionPurgeRunResultSchema,
  retentionPurgeStatusSchema,
  runRetentionPurgePayloadSchema,
} from "./retention-purge-schema";

describe("retention-purge schemas", () => {
  it("applies default dryRun=false when validating run payload", () => {
    const parsed = runRetentionPurgePayloadSchema.parse({});
    expect(parsed).toEqual({ dryRun: false });
  });

  it("enforces bounds on batchSize and maxBatches and rejects unknown keys", () => {
    expect(() =>
      runRetentionPurgePayloadSchema.parse({ batchSize: 5 }),
    ).toThrow();
    expect(() =>
      runRetentionPurgePayloadSchema.parse({ maxBatches: 101 }),
    ).toThrow();
    expect(() =>
      runRetentionPurgePayloadSchema.parse({ dryRun: true, unexpected: true }),
    ).toThrow();

    const valid = runRetentionPurgePayloadSchema.parse({
      dryRun: true,
      eventFamily: "AUTHENTICATION",
      batchSize: 200,
      maxBatches: 10,
    });
    expect(valid).toEqual({
      dryRun: true,
      eventFamily: "AUTHENTICATION",
      batchSize: 200,
      maxBatches: 10,
    });
  });

  it("parses valid retention purge status and run result payloads", () => {
    const sampleRun = {
      status: "DRY_RUN" as const,
      trigger: "MANUAL" as const,
      dryRun: true,
      startedAt: "2026-11-26T10:00:00.000Z",
      completedAt: "2026-11-26T10:00:01.000Z",
      durationMs: 1000,
      totalDeletedNormalizedEvents: 12,
      totalDeletedInvalidEvents: 3,
      totalProtectedEvents: 4,
      families: [
        {
          eventFamily: "AUTHENTICATION" as const,
          eligible: true,
          reason: "ACTIVE_POLICY" as const,
          retentionDays: 90,
          cutoffDate: "2026-08-28T10:00:00.000Z",
          policyIds: ["7d191192-3490-410a-ba53-3a72d3f92d44"],
          batchesExecuted: 0,
          deletedNormalizedEvents: 12,
          deletedDetections: 0,
          deletedFeatureContributions: 0,
          deletedMappings: 0,
          deletedDetectionJobs: 0,
          deletedInvalidEvents: 3,
          protectedByAlertOrIncident: 4,
          hasMore: false,
        },
      ],
    };

    expect(retentionPurgeRunResultSchema.parse(sampleRun).status).toBe("DRY_RUN");

    const parsedStatus = retentionPurgeStatusSchema.parse({
      enabled: true,
      workerActive: true,
      running: false,
      intervalMs: 3600000,
      batchSize: 200,
      maxBatchesPerRun: 50,
      runOnStartup: false,
      effectivePolicies: [
        {
          eventFamily: "AUTHENTICATION",
          eligible: true,
          reason: "ACTIVE_POLICY",
          retentionDays: 90,
          cutoffDate: "2026-08-28T10:00:00.000Z",
          policyIds: ["7d191192-3490-410a-ba53-3a72d3f92d44"],
          policyNames: ["Auth 90d"],
        },
      ],
      lastRun: sampleRun,
      recentRuns: [
        {
          id: "11111111-1111-4111-8111-111111111111",
          occurredAt: "2026-11-26T09:00:00.000Z",
          actorType: "SYSTEM",
          actorUserId: null,
          source: "WORKER",
          outcome: "SUCCESS",
          summary: { totalDeletedNormalizedEvents: 7 },
        },
      ],
    });

    expect(parsedStatus.workerActive).toBe(true);
    expect(parsedStatus.effectivePolicies).toHaveLength(1);
    expect(parsedStatus.recentRuns).toHaveLength(1);
  });
});
