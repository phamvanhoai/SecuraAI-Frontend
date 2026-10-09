import { expect, it } from "vitest";
import {
  closureFormSchema,
  incidentClosureSchema,
} from "./incident-closure-schema";
it("requires meaningful summary and explicit readiness confirmation", () => {
  expect(
    closureFormSchema.safeParse({ summary: "short", confirmed: true }).success,
  ).toBe(false);
  expect(
    closureFormSchema.safeParse({
      summary: "Recovery validated and findings recorded.",
      confirmed: false,
    }).success,
  ).toBe(false);
  expect(
    closureFormSchema.parse({
      summary: "  Recovery validated and findings recorded.  ",
      confirmed: true,
    }).summary,
  ).toBe("Recovery validated and findings recorded.");
});
it("rejects malformed closure metadata", () => {
  expect(incidentClosureSchema.safeParse({ canClose: true }).success).toBe(
    false,
  );
});
