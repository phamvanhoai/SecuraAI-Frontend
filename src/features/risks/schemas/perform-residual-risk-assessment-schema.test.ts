import { describe, expect, it } from "vitest";
import { performResidualRiskAssessmentRequestSchema } from "./perform-residual-risk-assessment-schema";

const valid = {
  residualLikelihood: 2,
  residualImpact: 3,
  assessmentNote: "Controls were verified as effective.",
  expectedUpdatedAt: "2026-09-22T08:00:00.000Z",
};

describe("perform residual risk assessment schema", () => {
  it("accepts a valid assessment", () => {
    expect(
      performResidualRiskAssessmentRequestSchema.safeParse(valid).success,
    ).toBe(true);
  });

  it.each([
    { ...valid, residualLikelihood: 0 },
    { ...valid, residualLikelihood: 6 },
    { ...valid, residualImpact: 1.5 },
    { ...valid, assessmentNote: "short" },
    { ...valid, expectedUpdatedAt: "yesterday" },
    { ...valid, unexpected: true },
  ])("rejects invalid or unexpected input", (input) => {
    expect(
      performResidualRiskAssessmentRequestSchema.safeParse(input).success,
    ).toBe(false);
  });
});
