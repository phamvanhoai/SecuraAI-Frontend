import { describe, expect, it } from "vitest";
import {
  assetCriticalityClassificationSchema,
  classifyAssetCriticalitySchema,
} from "./classify-asset-criticality-schema";

describe("classifyAssetCriticalitySchema", () => {
  it("accepts four integer scores and a supported data classification", () => {
    expect(
      classifyAssetCriticalitySchema.parse({
        confidentialityImpact: "5",
        integrityImpact: 4,
        availabilityImpact: 5,
        businessImpact: 4,
        dataClassification: "restricted",
      }),
    ).toEqual({
      confidentialityImpact: 5,
      integrityImpact: 4,
      availabilityImpact: 5,
      businessImpact: 4,
      dataClassification: "restricted",
    });
  });

  it.each([0, 6, 2.5])("rejects invalid impact score %s", (score) => {
    expect(
      classifyAssetCriticalitySchema.safeParse({
        confidentialityImpact: score,
        integrityImpact: 3,
        availabilityImpact: 3,
        businessImpact: 3,
        dataClassification: "internal",
      }).success,
    ).toBe(false);
  });

  it("validates the calculated backend response", () => {
    expect(
      assetCriticalityClassificationSchema.safeParse({
        assetId: "00000000-0000-4000-8000-000000000001",
        previousCriticality: "medium",
        criticality: "critical",
        previousDataClassification: "internal",
        dataClassification: "restricted",
        score: 4.55,
        changed: true,
        classifiedAt: "2026-09-10T10:00:00.000Z",
      }).success,
    ).toBe(true);
  });
});
