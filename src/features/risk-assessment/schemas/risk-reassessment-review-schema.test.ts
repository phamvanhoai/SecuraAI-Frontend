import { describe, expect, it } from "vitest";
import { riskReassessmentReviewItemSchema } from "./risk-reassessment-review-schema";

describe("risk reassessment review contract", () => {
  it("accepts an owner-scoped pending request", () => {
    const id = "11111111-1111-4111-8111-111111111111";
    expect(
      riskReassessmentReviewItemSchema.safeParse({
        id,
        reason: "The incident invalidates assumptions in the current assessment.",
        status: "pending",
        requestedAt: "2026-09-30T00:00:00.000Z",
        reviewedAt: null,
        risk: { id, riskCode: "RISK-1", title: "Account compromise", status: "open" },
        incident: { id, incidentCode: "INC-1", title: "Login", severity: "high" },
        controlWeakness: null,
        requestedBy: { id, fullName: "Security Officer" },
      }).success,
    ).toBe(true);
  });
});
