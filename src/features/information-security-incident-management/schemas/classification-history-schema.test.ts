import { expect, it } from "vitest";
import { classificationHistorySchema } from "./classification-history-schema";

const history = {
  items: [
    {
      id: "00000000-0000-4000-8000-000000000010",
      classifiedAt: "2026-10-09T00:00:00Z",
      classifiedBy: null,
      previousSeverity: "medium",
      severity: "high",
      rationale: "Business impact increased.",
    },
  ],
  pagination: { page: 1, limit: 10, total: 1, totalPages: 1 },
};
it("accepts nullable historical metadata and empty history", () => {
  expect(classificationHistorySchema.safeParse(history).success).toBe(true);
  expect(
    classificationHistorySchema.safeParse({
      ...history,
      items: [],
      pagination: { ...history.pagination, total: 0, totalPages: 0 },
    }).success,
  ).toBe(true);
});
it("rejects unknown severity and malformed dates", () => {
  expect(
    classificationHistorySchema.safeParse({
      ...history,
      items: [{ ...history.items[0], severity: "urgent" }],
    }).success,
  ).toBe(false);
  expect(
    classificationHistorySchema.safeParse({
      ...history,
      items: [{ ...history.items[0], classifiedAt: "yesterday" }],
    }).success,
  ).toBe(false);
});
