import { describe, expect, it } from "vitest";
import {
  detectionThresholdFormSchema,
  detectionThresholdSchema,
} from "./alert-threshold-schema";

describe("detection threshold schemas", () => {
  it("accepts a model-level threshold", () => {
    expect(
      detectionThresholdFormSchema.parse({ thresholdPercent: "80" }),
    ).toEqual({ thresholdPercent: 80 });
  });

  it.each([49, 101])(
    "rejects an out-of-range percentage %s",
    (thresholdPercent) => {
      expect(
        detectionThresholdFormSchema.safeParse({ thresholdPercent }).success,
      ).toBe(false);
    },
  );

  it("validates the deployed model boundary", () => {
    expect(
      detectionThresholdSchema.safeParse({
        modelVersionId: "c82662ff-8cb7-4e97-b5f6-b0b1d9cb54c8",
        modelName: "Secura Detector",
        version: "2.0",
        status: "deployed",
        threshold: 0.8,
        deployedAt: "2026-09-25T00:00:00.000Z",
      }).success,
    ).toBe(true);
  });
});
