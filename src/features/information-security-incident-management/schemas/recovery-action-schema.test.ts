import { expect, it } from "vitest";
import {
  recoveryFormSchema,
  recoveryActionSchema,
} from "./recovery-action-schema";
it("validates completed recovery descriptions and local timestamps", () => {
  const input = {
    description:
      "Removed malicious scheduled task and verified the host is clean.",
    performedAt: "2026-01-01T09:30",
  };
  expect(
    recoveryFormSchema.parse({
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
    expect(recoveryFormSchema.safeParse(invalid).success).toBe(false);
});
it("rejects malformed API actions", () => {
  expect(
    recoveryActionSchema.safeParse({ id: "bad", phase: "recovery" }).success,
  ).toBe(false);
});
