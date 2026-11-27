import { beforeEach, describe, expect, it, vi } from "vitest";
import { apiRequest } from "@/lib/api/api-client";
import { getRetentionPurgeStatus, runRetentionPurge } from "./retention-purge";

vi.mock("@/lib/api/api-client", () => ({
  apiRequest: vi.fn(),
}));

describe("retentionPurge api client", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("fetches retention purge worker status and recent audited runs", async () => {
    vi.mocked(apiRequest).mockResolvedValue({
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
          cutoffDate: "2026-08-28T00:00:00.000Z",
          policyIds: ["7d191192-3490-410a-ba53-3a72d3f92d44"],
          policyNames: ["Authentication Retention Policy"],
        },
      ],
      lastRun: null,
      recentRuns: [],
    });

    const result = await getRetentionPurgeStatus();

    expect(apiRequest).toHaveBeenCalledWith(
      "/api/event-governance/retention-purge/status",
      { target: "same-origin", method: "GET" },
    );
    expect(result.workerActive).toBe(true);
    expect(result.effectivePolicies[0]?.retentionDays).toBe(90);
  });

  it("validates payload and triggers manual or dry-run retention purge", async () => {
    vi.mocked(apiRequest).mockResolvedValue({
      status: "DRY_RUN",
      trigger: "MANUAL",
      dryRun: true,
      startedAt: "2026-11-26T10:00:00.000Z",
      completedAt: "2026-11-26T10:00:00.500Z",
      durationMs: 500,
      totalDeletedNormalizedEvents: 15,
      totalDeletedInvalidEvents: 2,
      totalProtectedEvents: 3,
      families: [],
    });

    const result = await runRetentionPurge({
      dryRun: true,
      eventFamily: "AUTHENTICATION",
      batchSize: 100,
    });

    expect(apiRequest).toHaveBeenCalledWith(
      "/api/event-governance/retention-purge/run",
      {
        target: "same-origin",
        method: "POST",
        body: {
          dryRun: true,
          eventFamily: "AUTHENTICATION",
          batchSize: 100,
        },
      },
    );
    expect(result.status).toBe("DRY_RUN");
    expect(result.totalDeletedNormalizedEvents).toBe(15);
    expect(result.totalProtectedEvents).toBe(3);
  });
});
