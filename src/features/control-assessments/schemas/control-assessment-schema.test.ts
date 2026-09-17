import { describe, expect, it } from "vitest";
import { createAssessmentSchema } from "./control-assessment-schema";

describe("createAssessmentSchema", () => {
  it("accepts valid compliance values", () => {
    expect(createAssessmentSchema.parse({ complianceStatus: "compliant", score: 100 }).score).toBe(100);
  });
  it("rejects scores outside 0 through 100", () => {
    expect(() => createAssessmentSchema.parse({ complianceStatus: "non_compliant", score: -1 })).toThrow();
  });
  it("rejects a score inconsistent with status", () => {
    expect(() => createAssessmentSchema.parse({ complianceStatus: "compliant", score: 60 })).toThrow();
    expect(() => createAssessmentSchema.parse({ complianceStatus: "not_assessed", score: 0 })).toThrow();
  });
});
