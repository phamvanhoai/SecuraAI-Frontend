import { describe, expect, it } from "vitest";
import { createRiskAssessmentRequestSchema } from "./create-risk-assessment-schema";

const request = {
  title: "Unauthorized access to customer data",
  description: "Customer records may be exposed through a compromised account.",
  ownerUserId: "00000000-0000-4000-8000-000000000001",
  reviewDate: "2027-01-15",
  scope: { type: "asset", assetId: "00000000-0000-4000-8000-000000000002" },
} as const;

describe("create risk assessment request", () => {
  it("accepts the V2 contract", () => {
    expect(createRiskAssessmentRequestSchema.safeParse(request).success).toBe(true);
  });

  it("rejects evaluation data that belongs to later workflow steps", () => {
    expect(createRiskAssessmentRequestSchema.safeParse({ ...request, inherentImpact: 5 }).success).toBe(false);
  });
});
