import { describe, expect, it } from "vitest";
import {
  createRiskReassessmentRequestFormSchema,
  riskReassessmentRequestHistorySchema,
} from "./risk-reassessment-request-schema";

describe("risk reassessment request schema", () => {
  it("accepts a linked risk with an optional control weakness", () => {
    expect(
      createRiskReassessmentRequestFormSchema.safeParse({
        riskId: "11111111-1111-4111-8111-111111111111",
        controlFindingId: "",
        reason:
          "The incident indicates that the current risk rating may be understated.",
      }).success,
    ).toBe(true);
  });
  it("accepts auditable request history details", () => {
    const result = riskReassessmentRequestHistorySchema.parse({
      incident: {
        id: "11111111-1111-4111-8111-111111111111",
        incidentCode: "INC-1",
        title: "Login",
      },
      items: [
        {
          id: "22222222-2222-4222-8222-222222222222",
          reason:
            "The incident changes the assumptions behind the current risk rating.",
          status: "pending",
          requestedAt: "2026-10-01T02:00:00.000Z",
          reviewedAt: null,
          reviewComment: null,
          risk: {
            id: "33333333-3333-4333-8333-333333333333",
            riskCode: "RISK-1",
            title: "Account compromise",
            status: "open",
            owner: {
              id: "44444444-4444-4444-8444-444444444444",
              fullName: "Risk Owner",
            },
          },
          controlWeakness: null,
          requestedBy: {
            id: "55555555-5555-4555-8555-555555555555",
            fullName: "Security Officer",
          },
          reviewedBy: null,
        },
      ],
      pagination: { page: 1, limit: 10, total: 1, totalPages: 1 },
    });
    expect(result.items[0]?.risk.owner?.fullName).toBe("Risk Owner");
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
