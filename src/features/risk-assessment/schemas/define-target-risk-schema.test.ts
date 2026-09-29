import { describe, expect, it } from "vitest";
import { defineTargetRiskSchema } from "./define-target-risk-schema";
describe("define target risk form", () => {
  const valid = {
    treatmentPlanId: "00000000-0000-4000-8000-000000000001",
    targetRisk: "low",
    rationale: "Expected exposure after all treatment actions are completed.",
  } as const;
  it("accepts a complete target", () =>
    expect(defineTargetRiskSchema.safeParse(valid).success).toBe(true));
  it("rejects an invalid level", () =>
    expect(
      defineTargetRiskSchema.safeParse({ ...valid, targetRisk: "none" })
        .success,
    ).toBe(false));
});
