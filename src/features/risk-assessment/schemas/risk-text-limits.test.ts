import { describe, expect, it } from "vitest";
import type { ZodType } from "zod";
import { createRiskAssessmentSchema, createRiskAssessmentRequestSchema } from "./create-risk-assessment-schema";
import { identifyThreatSchema } from "./identify-threat-schema";
import { updateThreatSchema } from "./update-threat-schema";
import { identifyVulnerabilitySchema } from "./identify-vulnerability-schema";
import { updateVulnerabilitySchema } from "./update-vulnerability-schema";
import { assessInherentRiskSchema } from "./assess-inherent-risk-schema";
import { assessResidualRiskSchema } from "./assess-residual-risk-schema";
import { defineTargetRiskSchema } from "./define-target-risk-schema";
import { createRiskTreatmentPlanSchema } from "./create-risk-treatment-plan-schema";
import { updateRiskTreatmentPlanSchema } from "./update-risk-treatment-plan-schema";
import { submitRiskAcceptanceSchema, decideRiskAcceptanceSchema, openRiskReviewSchema } from "./risk-acceptance-schema";
import { acceptanceCostSchema } from "./acceptance-cost-schema";
import { completeRiskReviewSchema } from "./complete-risk-review-schema";
const cases: Array<{ label: string; schema: ZodType; min: number; max: number }> = [
  { label: "createRiskAssessmentSchema.title", schema: createRiskAssessmentSchema.shape.title, min: 3, max: 100 },
  { label: "createRiskAssessmentSchema.description", schema: createRiskAssessmentSchema.shape.description, min: 20, max: 2000 },
  { label: "createRiskAssessmentRequestSchema.title", schema: createRiskAssessmentRequestSchema.shape.title, min: 3, max: 100 },
  { label: "createRiskAssessmentRequestSchema.description", schema: createRiskAssessmentRequestSchema.shape.description, min: 20, max: 2000 },
  { label: "identifyThreatSchema.name", schema: identifyThreatSchema.shape.name, min: 2, max: 100 },
  { label: "identifyThreatSchema.description", schema: identifyThreatSchema.shape.description, min: 20, max: 2000 },
  { label: "updateThreatSchema.name", schema: updateThreatSchema.shape.name, min: 2, max: 100 },
  { label: "updateThreatSchema.description", schema: updateThreatSchema.shape.description, min: 20, max: 2000 },
  { label: "identifyVulnerabilitySchema.name", schema: identifyVulnerabilitySchema.shape.name, min: 2, max: 100 },
  { label: "identifyVulnerabilitySchema.description", schema: identifyVulnerabilitySchema.shape.description, min: 20, max: 2000 },
  { label: "updateVulnerabilitySchema.name", schema: updateVulnerabilitySchema.shape.name, min: 2, max: 100 },
  { label: "updateVulnerabilitySchema.description", schema: updateVulnerabilitySchema.shape.description, min: 20, max: 2000 },
  { label: "assessInherentRiskSchema.assessmentReason", schema: assessInherentRiskSchema.shape.assessmentReason, min: 10, max: 2000 },
  { label: "assessResidualRiskSchema.assessmentReason", schema: assessResidualRiskSchema.shape.assessmentReason, min: 10, max: 2000 },
  { label: "defineTargetRiskSchema.rationale", schema: defineTargetRiskSchema.shape.rationale, min: 10, max: 2000 },
  { label: "createRiskTreatmentPlanSchema.title", schema: createRiskTreatmentPlanSchema.shape.title, min: 3, max: 100 },
  { label: "updateRiskTreatmentPlanSchema.title", schema: updateRiskTreatmentPlanSchema.shape.title, min: 3, max: 100 },
  { label: "submitRiskAcceptanceSchema.assessmentReason", schema: submitRiskAcceptanceSchema.shape.assessmentReason, min: 10, max: 2000 },
  { label: "submitRiskAcceptanceSchema.acceptanceReason", schema: submitRiskAcceptanceSchema.shape.acceptanceReason, min: 10, max: 2000 },
  { label: "decideRiskAcceptanceSchema.reason", schema: decideRiskAcceptanceSchema.shape.reason, min: 10, max: 2000 },
  { label: "openRiskReviewSchema.reason", schema: openRiskReviewSchema.shape.reason, min: 10, max: 2000 },
  { label: "acceptanceCostSchema.basis", schema: acceptanceCostSchema.shape.basis, min: 10, max: 2000 },
  { label: "completeRiskReviewSchema.conclusion", schema: completeRiskReviewSchema.shape.conclusion, min: 10, max: 2000 },
  { label: "createRiskTreatmentPlanSchema action title", schema: createRiskTreatmentPlanSchema.shape.actions.element.shape.title, min: 3, max: 100 },
  { label: "updateRiskTreatmentPlanSchema action title", schema: updateRiskTreatmentPlanSchema.shape.actions.element.shape.title, min: 3, max: 100 },
];
describe.each(cases)("$label text boundaries", ({ schema, min, max }) => {
  it.each(["below", "minimum", "maximum", "above"])("checks %s after trimming", (boundary) => {
    const length = boundary === "below" ? min - 1 : boundary === "minimum" ? min : boundary === "maximum" ? max : max + 1;
    expect(schema.safeParse("  " + "a".repeat(length) + "  ").success).toBe(length >= min && length <= max);
  });
  it("rejects whitespace-only required text", () => expect(schema.safeParse("   ").success).toBe(false));
});
const description = createRiskTreatmentPlanSchema.shape.actions.element.shape.description;
describe("optional action description", () => {
  it.each([undefined, "", "   ", "a".repeat(20), "a".repeat(2000)])("accepts blank or in-range text", (value) => expect(description.safeParse(value).success).toBe(true));
  it.each([1, 19, 2001])("rejects %i characters after trimming", (length) => expect(description.safeParse("  " + "a".repeat(length) + "  ").success).toBe(false));
});
