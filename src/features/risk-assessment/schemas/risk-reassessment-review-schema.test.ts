import { describe, expect, it } from "vitest";
import {
  rejectRiskReassessmentFormSchema,
  riskReassessmentReviewItemSchema,
} from "./risk-reassessment-review-schema";

describe("risk reassessment review contract", () => {
  it("accepts an owner-scoped pending request", () => {
    const id = "11111111-1111-4111-8111-111111111111";
    expect(
      riskReassessmentReviewItemSchema.safeParse({
        id,
        reason:
          "The incident invalidates assumptions in the current assessment.",
        status: "pending",
        requestedAt: "2026-09-30T00:00:00.000Z",
        reviewedAt: null,
        reviewComment: null,
        canReject: true,
        risk: {
          id,
          riskCode: "RISK-1",
          title: "Account compromise",
          status: "open",
          latestInherentAssessment: null,
          treatmentPlans: [],
        },
        incident: {
          id,
          incidentCode: "INC-1",
          title: "Login",
          severity: "high",
        },
        controlWeakness: null,
        requestedBy: { id, fullName: "Security Officer" },
        reviewedBy: null,
      }).success,
    ).toBe(true);
  });

  it("requires an auditable rejection reason", () => {
    expect(
      rejectRiskReassessmentFormSchema.safeParse({ reason: "Too short" })
        .success,
    ).toBe(false);
    expect(
      rejectRiskReassessmentFormSchema.safeParse({
        reason:
          "The incident does not change the assumptions used by this risk.",
      }).success,
    ).toBe(true);
  });
});
