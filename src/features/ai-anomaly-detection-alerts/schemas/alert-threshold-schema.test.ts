import { describe, expect, it } from "vitest";
import { alertThresholdFormSchema } from "./alert-threshold-schema";

describe("alertThresholdFormSchema", () => {
  const valid = {
    assetId: "00000000-0000-4000-8000-000000000001",
    thresholdPercent: 80,
    riskLevelMin: "high",
    enabled: true,
  };

  it("accepts a valid asset threshold", () => {
    expect(alertThresholdFormSchema.parse(valid)).toEqual(valid);
  });

  it.each([0, 101])("rejects the out-of-range percentage %s", (thresholdPercent) => {
    expect(alertThresholdFormSchema.safeParse({ ...valid, thresholdPercent }).success).toBe(false);
  });

  it("requires an asset", () => {
    expect(alertThresholdFormSchema.safeParse({ ...valid, assetId: "" }).success).toBe(false);
  });
});
