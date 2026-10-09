import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  createRiskAssessmentRequestSchema,
  createRiskAssessmentSchema,
} from "./create-risk-assessment-schema";
import {
  nextRiskReviewDate,
  riskToday,
  reviewDatePreview,
} from "./risk-review-date";

const request = {
  title: "Unauthorized access to customer data",
  description: "Customer records may be exposed through a compromised account.",
  ownerUserId: "00000000-0000-4000-8000-000000000001",
  reviewDate: "2027-01-15",
  scope: { type: "asset", assetId: "00000000-0000-4000-8000-000000000002" },
} as const;

describe("create risk assessment request", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-10-03T10:00:00Z"));
  });
  afterEach(() => vi.useRealTimers());
  it("accepts the V2 contract", () => {
    expect(createRiskAssessmentRequestSchema.safeParse(request).success).toBe(
      true,
    );
  });

  it("rejects evaluation data that belongs to later workflow steps", () => {
    expect(
      createRiskAssessmentRequestSchema.safeParse({
        ...request,
        inherentImpact: 5,
      }).success,
    ).toBe(false);
  });
  it.each(["2026-10-02", "2026-10-03"])(
    "rejects past or today date %s at both boundaries",
    (reviewDate) => {
      expect(
        createRiskAssessmentRequestSchema.safeParse({ ...request, reviewDate })
          .success,
      ).toBe(false);
      expect(
        createRiskAssessmentSchema.safeParse({
          ...request,
          scopeType: "asset",
          scopeId: request.scope.assetId,
          reviewDate,
        }).success,
      ).toBe(false);
    },
  );
  it("accepts tomorrow", () => {
    expect(
      createRiskAssessmentRequestSchema.safeParse({
        ...request,
        reviewDate: "2026-10-04",
      }).success,
    ).toBe(true);
  });
  it("refreshes the date rule at UTC+7 midnight without reloading the module", () => {
    vi.setSystemTime(new Date("2026-10-03T16:59:59Z"));
    expect(nextRiskReviewDate()).toBe("2026-10-04");
    vi.setSystemTime(new Date("2026-10-03T17:00:00Z"));
    expect(riskToday()).toBe("2026-10-04");
    expect(nextRiskReviewDate()).toBe("2026-10-05");
    expect(
      createRiskAssessmentRequestSchema.safeParse({
        ...request,
        reviewDate: "2026-10-04",
      }).success,
    ).toBe(false);
  });
  it("handles year and leap-day boundaries and provides an unambiguous preview", () => {
    expect(nextRiskReviewDate(new Date("2026-12-31T10:00:00Z"))).toBe(
      "2027-01-01",
    );
    expect(nextRiskReviewDate(new Date("2028-02-28T10:00:00Z"))).toBe(
      "2028-02-29",
    );
    expect(reviewDatePreview("2026-10-04")).toBe("04/10/2026");
  });
});
