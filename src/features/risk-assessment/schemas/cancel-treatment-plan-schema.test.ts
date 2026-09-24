import { describe, expect, it } from "vitest";
import { cancelTreatmentPlanRequestSchema } from "./cancel-treatment-plan-schema";

describe("cancelTreatmentPlanRequestSchema", () => {
  const expectedUpdatedAt = "2026-09-21T01:00:00.000Z";

  it("accepts a meaningful cancellation reason", () => {
    expect(cancelTreatmentPlanRequestSchema.parse({
      expectedUpdatedAt,
      reason: "Created for the wrong assessment.",
    }).reason).toBe("Created for the wrong assessment.");
  });

  it("rejects a short cancellation reason", () => {
    expect(() => cancelTreatmentPlanRequestSchema.parse({ expectedUpdatedAt, reason: "mistake" })).toThrow();
  });
});
