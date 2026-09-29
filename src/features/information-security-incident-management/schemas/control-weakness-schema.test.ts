import { describe, expect, it } from "vitest";
import { recordControlWeaknessFormSchema } from "./control-weakness-schema";
describe("control weakness schema", () => {
  it("requires a linked control and meaningful description", () => {
    expect(
      recordControlWeaknessFormSchema.safeParse({
        controlId: "",
        severity: "high",
        description: "too short",
      }).success,
    ).toBe(false);
    expect(
      recordControlWeaknessFormSchema.safeParse({
        controlId: "33333333-3333-4333-8333-333333333333",
        severity: "high",
        description: "MFA was not enforced for the affected account.",
      }).success,
    ).toBe(true);
  });
});
