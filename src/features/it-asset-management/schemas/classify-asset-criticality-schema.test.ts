import { describe, expect, it } from "vitest";
import {
  assetCriticalityClassificationSchema,
  classifyAssetCriticalitySchema,
} from "./classify-asset-criticality-schema";

describe("classifyAssetCriticalitySchema", () => {
  it.each(["", " ".repeat(30), "short", "x".repeat(2001)])(
    "rejects missing or invalid separate data classification basis",
    (dataClassificationBasis) => {
      expect(
        classifyAssetCriticalitySchema.safeParse({
          confidentialityImpact: 1,
          integrityImpact: 1,
          availabilityImpact: 5,
          businessImpact: 1,
          dataClassification: "public",
          rationale: "An outage stops essential operations.",
          dataClassificationBasis,
        }).success,
      ).toBe(false);
    },
  );
  it("accepts four integer scores and a supported data classification", () => {
    expect(
      classifyAssetCriticalitySchema.parse({
        confidentialityImpact: "5",
        integrityImpact: 4,
        availabilityImpact: 5,
        businessImpact: 4,
        dataClassification: "restricted",
        dataClassificationBasis:
          "Only approved public information is handled; no sensitive records are stored.",
        rationale:
          "Disclosure of customer records would cause severe business harm.",
      }),
    ).toEqual({
      confidentialityImpact: 5,
      integrityImpact: 4,
      availabilityImpact: 5,
      businessImpact: 4,
      dataClassification: "restricted",
      dataClassificationBasis:
        "Only approved public information is handled; no sensitive records are stored.",
      rationale:
        "Disclosure of customer records would cause severe business harm.",
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
        dataClassificationBasis:
          "Only approved public information is handled; no sensitive records are stored.",
        rationale:
          "Disclosure of customer records would cause severe business harm.",
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
        dataClassificationBasis:
          "Only approved public information is handled; no sensitive records are stored.",
        rationale:
          "Disclosure of customer records would cause severe business harm.",
        score: 5,
        methodVersion: "SECURAAI-ASSET-IMPACT-v1",
        changed: true,
        classifiedAt: "2026-09-10T10:00:00.000Z",
      }).success,
    ).toBe(true);
  });
  it.each(["", " ".repeat(30), "short", "x".repeat(2001)])(
    "requires assessment basis",
    (rationale) => {
      expect(
        classifyAssetCriticalitySchema.safeParse({
          confidentialityImpact: 1,
          integrityImpact: 1,
          availabilityImpact: 5,
          businessImpact: 1,
          dataClassification: "public",
          rationale,
        }).success,
      ).toBe(false);
    },
  );
});
