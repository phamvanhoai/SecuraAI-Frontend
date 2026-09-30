import { describe, expect, it } from "vitest";
import { createAssessmentSchema } from "./control-assessment-schema";
describe("createAssessmentSchema", () => {
  const valid = {
    testMethod: "Inspect configuration and sample access logs",
    result: "effective",
    effectiveness: 92,
    notes: "The control operated consistently throughout the sampled period.",
  } as const;
  it("accepts complete effectiveness results", () => {
    expect(createAssessmentSchema.safeParse(valid).success).toBe(true);
  });
  it("rejects scores outside 0 through 100", () => {
    expect(
      createAssessmentSchema.safeParse({ ...valid, effectiveness: 101 })
        .success,
    ).toBe(false);
  });
  it("requires a meaningful test method and notes", () => {
    expect(
      createAssessmentSchema.safeParse({
        ...valid,
        testMethod: "x",
        notes: "short",
      }).success,
    ).toBe(false);
  });
});
