import { describe, expect, it } from "vitest";
import { createRiskReassessmentRequestFormSchema } from "./risk-reassessment-request-schema";

describe("risk reassessment request schema", () => {
  it("accepts a linked risk with an optional control weakness", () => {
    expect(
      createRiskReassessmentRequestFormSchema.safeParse({
        riskId: "11111111-1111-4111-8111-111111111111",
        controlFindingId: "",
        reason: "The incident indicates that the current risk rating may be understated.",
      }).success,
    ).toBe(true);
  });
  it("rejects a reason without enough decision context", () => {
    expect(
      createRiskReassessmentRequestFormSchema.safeParse({
        riskId: "11111111-1111-4111-8111-111111111111",
        controlFindingId: "",
        reason: "Review it",
      }).success,
    ).toBe(false);
  });
});
