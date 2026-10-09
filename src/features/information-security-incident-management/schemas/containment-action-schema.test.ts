import { expect, it } from "vitest";
import {
  containmentFormSchema,
  containmentActionSchema,
} from "./containment-action-schema";
it("validates completed containment descriptions and local timestamps", () => {
  const input = {
    description: "Isolated affected host from the corporate network.",
    performedAt: "2026-01-01T09:30",
  };
  expect(
    containmentFormSchema.parse({
      ...input,
      description: `  ${input.description}  `,
    }).description,
  ).toBe(input.description);
  for (const invalid of [
    { ...input, description: "short" },
    { ...input, description: "x".repeat(4001) },
    { ...input, performedAt: "invalid" },
    { ...input, performedAt: "2099-01-01T00:00" },
  ])
    expect(containmentFormSchema.safeParse(invalid).success).toBe(false);
});
it("rejects malformed API actions", () => {
  expect(
    containmentActionSchema.safeParse({ id: "bad", phase: "eradication" })
      .success,
  ).toBe(false);
});
