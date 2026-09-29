import { describe, expect, it } from "vitest";
import { assessResidualRiskSchema } from "./assess-residual-risk-schema";
describe("assess residual risk form", () => {
  const valid = {
    likelihood: 2,
    impact: 3,
    targetRisk: "low",
    riskAppetite: "medium",
    riskTolerance: "medium",
    assessmentReason:
      "Remaining exposure after reviewing implemented controls.",
  } as const;
  it("accepts a complete assessment", () =>
    expect(assessResidualRiskSchema.safeParse(valid).success).toBe(true));
  it("rejects an invalid rating", () =>
    expect(
      assessResidualRiskSchema.safeParse({ ...valid, riskTolerance: "extreme" })
        .success,
    ).toBe(false));
});
