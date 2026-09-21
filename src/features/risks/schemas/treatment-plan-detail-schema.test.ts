import { describe, expect, it } from "vitest";
import { treatmentPlanDetailSchema } from "./treatment-plan-detail-schema";

describe("treatmentPlanDetailSchema", () => {
  it("rejects action progress outside the business range", () => {
    const result = treatmentPlanDetailSchema.safeParse({
      actions: [{ progressPercent: 101 }],
    });
    expect(result.success).toBe(false);
  });
});
