import { describe, expect, it } from "vitest";
import { createAssessmentSchema } from "./control-assessment-schema";
describe("createAssessmentSchema", () => {
  const valid = {
    testMethod: "Inspect configuration and sample access logs",
    result: "effective",
    effectiveness: 92,
    notes: "The control operated consistently throughout the sampled period.",
  } as const;
  it("requires a baseline and a reason for implementation changes", () => {
    expect(
      createAssessmentSchema.safeParse({
        ...valid,
        implementationStatus: "implemented",
      }).success,
    ).toBe(false);
    expect(
      createAssessmentSchema.safeParse({
        ...valid,
        implementationStatus: "implemented",
        expectedImplementationStatus: "planned",
      }).success,
    ).toBe(false);
    expect(
      createAssessmentSchema.safeParse({
        ...valid,
        implementationStatus: "implemented",
        expectedImplementationStatus: "planned",
        implementationChangeReason:
          "Deployment completed across the intended scope.",
      }).success,
    ).toBe(true);
    expect(
      createAssessmentSchema.safeParse({
        ...valid,
        implementationStatus: "planned",
        expectedImplementationStatus: "planned",
      }).success,
    ).toBe(true);
  });
  it.each([
    [0, "ineffective"],
    [49.99, "ineffective"],
    [50, "partially_effective"],
    [79.99, "partially_effective"],
    [80, "effective"],
    [100, "effective"],
  ])("classifies score %s as %s", (effectiveness, result) => {
    expect(
      createAssessmentSchema.safeParse({ ...valid, effectiveness, result })
        .success,
    ).toBe(true);
  });
  it.each([
    [0, "effective"],
    [100, "ineffective"],
    [50, "effective"],
    [80, "partially_effective"],
  ])("rejects inconsistent score %s and result %s", (effectiveness, result) => {
    expect(
      createAssessmentSchema.safeParse({ ...valid, effectiveness, result })
        .success,
    ).toBe(false);
  });
  it("rejects excess precision that could round across a result threshold", () => {
    expect(
      createAssessmentSchema.safeParse({
        ...valid,
        effectiveness: 79.999,
        result: "partially_effective",
      }).success,
    ).toBe(false);
  });
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
