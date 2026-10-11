import { expect, it } from "vitest";
import {
  analysisFormSchema,
  currentAnalysisSchema,
  analysisHistorySchema,
} from "./incident-analysis-schema";
const values = {
  rootCause: "Verified authentication control gap.",
  lessonsLearned: "Review privileged access exceptions.",
  improvementActions: "Remove obsolete access and enforce MFA.",
};
it("validates and trims all three required findings", () => {
  expect(
    analysisFormSchema.parse({
      ...values,
      rootCause: "  " + values.rootCause + "  ",
    }),
  ).toEqual(values);
  for (const key of ["rootCause", "lessonsLearned", "improvementActions"]) {
    expect(
      analysisFormSchema.safeParse({ ...values, [key]: "short" }).success,
    ).toBe(false);
    expect(
      analysisFormSchema.safeParse({ ...values, [key]: "x".repeat(4001) })
        .success,
    ).toBe(false);
  }
});
it("handles absent analysis honestly and validates history boundary", () => {
  expect(
    currentAnalysisSchema.parse({
      analysis: null,
      canEdit: false,
      editRestriction: "Not ready",
    }).analysis,
  ).toBeNull();
  expect(
    analysisHistorySchema.safeParse({
      items: [],
      pagination: { page: 1, limit: 10, total: 0, totalPages: 0 },
    }).success,
  ).toBe(true);
  expect(
    currentAnalysisSchema.safeParse({
      analysis: {},
      canEdit: true,
      editRestriction: null,
    }).success,
  ).toBe(false);
});
