import { describe, expect, it } from "vitest";
import { anomalyDetectionRunResultSchema } from "./anomaly-detection-run-schema";

describe("anomaly detection run result", () => {
  it("accepts a persisted detection summary", () => {
    expect(
      anomalyDetectionRunResultSchema.parse({
        modelVersionId: "00000000-0000-4000-8000-000000000001",
        modelName: "security-anomaly",
        modelVersion: "2.0",
        lookbackHours: 24,
        eventsEvaluated: 12,
        anomaliesDetected: 2,
        detectionsCreated: 12,
        alertsCreated: 2,
        threshold: 0.8,
        completedAt: "2026-09-25T00:00:00.000Z",
      }).alertsCreated,
    ).toBe(2);
  });
});
