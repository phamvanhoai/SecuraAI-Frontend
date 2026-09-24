import { describe, expect, it } from "vitest";
import {
  assetCriticalityClassificationSchema,
  classifyAssetCriticalitySchema,
} from "./classify-asset-criticality-schema";

describe("classifyAssetCriticalitySchema", () => {
  it("accepts four integer scores from 1 to 5 and trims the reason", () => {
    expect(
      classifyAssetCriticalitySchema.parse({
        confidentialityImpact: "5",
        integrityImpact: 4,
        availabilityImpact: 5,
        businessImpact: 4,
        reason: " Production database ",
      }),
    ).toEqual({
      confidentialityImpact: 5,
      integrityImpact: 4,
      availabilityImpact: 5,
      businessImpact: 4,
      reason: "Production database",
    });
  });

  it.each([0, 6, 2.5])("rejects invalid impact score %s", (score) => {
    expect(
      classifyAssetCriticalitySchema.safeParse({
        confidentialityImpact: score,
        integrityImpact: 3,
        availabilityImpact: 3,
        businessImpact: 3,
        reason: "Test",
      }).success,
    ).toBe(false);
  });

  it("validates the calculated backend response", () => {
    expect(
      assetCriticalityClassificationSchema.safeParse({
        assetId: "00000000-0000-4000-8000-000000000001",
        previousCriticality: "medium",
        criticality: "critical",
        score: 4.55,
        changed: true,
        classifiedAt: "2026-09-10T10:00:00.000Z",
      }).success,
    ).toBe(true);
  });
});
