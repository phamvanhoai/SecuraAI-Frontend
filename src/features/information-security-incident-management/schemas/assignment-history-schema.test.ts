import { expect, it } from "vitest";
import { assignmentHistorySchema } from "./assignment-history-schema";
const id = "00000000-0000-4000-8000-000000000010";
const entry = {
  id,
  assignedAt: "2026-10-09T00:00:00Z",
  assignedBy: null,
  previousHandler: null,
  handler: { id, name: "Officer" },
  note: null,
};
const response = {
  items: [entry],
  pagination: { page: 1, limit: 10, total: 1, totalPages: 1 },
};
it("accepts first assignments and unavailable notes/actors", () =>
  expect(assignmentHistorySchema.safeParse(response).success).toBe(true));
it("rejects invalid identifiers and timestamps", () => {
  expect(
    assignmentHistorySchema.safeParse({
      ...response,
      items: [{ ...entry, assignedAt: "bad" }],
    }).success,
  ).toBe(false);
  expect(
    assignmentHistorySchema.safeParse({
      ...response,
      items: [{ ...entry, id: "bad" }],
    }).success,
  ).toBe(false);
});
