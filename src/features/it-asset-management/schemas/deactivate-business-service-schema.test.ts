import { describe, expect, it } from "vitest";
import { deactivateBusinessServiceSchema as schema } from "./deactivate-business-service-schema";
const valid = {
  expectedUpdatedAt: "2026-10-07T00:00:00Z",
  confirmationName: "Support",
  reason: "Service no longer in operational use",
};
describe("Deactivate validation", () => {
  it("normalizes input", () =>
    expect(
      schema.parse({
        ...valid,
        confirmationName: " Support  Service ",
        reason: " Retired after service migration ",
      }),
    ).toMatchObject({
      confirmationName: "Support Service",
      reason: "Retired after service migration",
    }));
  it.each([
    { ...valid, reason: " " },
    { ...valid, reason: "a".repeat(2001) },
    { ...valid, confirmationName: "" },
    { ...valid, expectedUpdatedAt: "today" },
    { ...valid, status: "inactive" },
    { ...valid, assetIds: [] },
  ])("rejects invalid body %j", (value) =>
    expect(schema.safeParse(value).success).toBe(false),
  );
});
