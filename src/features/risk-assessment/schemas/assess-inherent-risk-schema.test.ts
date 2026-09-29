import { describe, expect, it } from "vitest";
import { assessInherentRiskSchema } from "./assess-inherent-risk-schema";
describe("assess inherent risk form", () => {
  it("accepts a complete assessment", () => {
    expect(
      assessInherentRiskSchema.safeParse({
        likelihood: 4,
        impact: 5,
        assessmentReason:
          "Based on asset criticality and the documented threat scenario.",
      }).success,
    ).toBe(true);
  });
  it("rejects invalid scores", () => {
    expect(
      assessInherentRiskSchema.safeParse({
        likelihood: 0,
        impact: 6,
        assessmentReason: "A sufficiently detailed assessment basis.",
      }).success,
    ).toBe(false);
  });
});
