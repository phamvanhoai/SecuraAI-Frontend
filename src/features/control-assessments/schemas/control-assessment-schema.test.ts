import { describe, expect, it } from "vitest";
import { createAssessmentSchema } from "./control-assessment-schema";

describe("createAssessmentSchema", () => {
  it("accepts valid compliance values", () => {
    expect(createAssessmentSchema.parse({ complianceStatus: "compliant", score: 100 }).score).toBe(100);
  });
  it("rejects scores outside 0 through 100", () => {
    expect(() => createAssessmentSchema.parse({ complianceStatus: "non_compliant", score: -1 })).toThrow();
  });
  it("allows an optional score independent of status", () => {
    expect(createAssessmentSchema.parse({ complianceStatus: "compliant", score: 60 }).score).toBe(60);
    expect(createAssessmentSchema.parse({ complianceStatus: "not_assessed" }).score).toBeUndefined();
  });
});
