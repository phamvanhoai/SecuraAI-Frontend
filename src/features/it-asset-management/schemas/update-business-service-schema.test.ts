import { describe, expect, it } from "vitest";
import { updateBusinessServiceSchema as schema } from "./update-business-service-schema";
const expectedUpdatedAt = "2026-10-07T00:00:00.000Z";
describe("Edit service strict boundary", () => {
  it("normalizes patch and supports explicit clear", () => {
    expect(
      schema.parse({ name: " Support  Updated ", expectedUpdatedAt }),
    ).toMatchObject({ name: "Support Updated" });
    expect(
      schema.safeParse({ expectedUpdatedAt, ownerUserId: null }).success,
    ).toBe(true);
  });
  it.each([
    { expectedUpdatedAt },
    { name: "Support" },
    { expectedUpdatedAt, status: "active" },
    { expectedUpdatedAt, assets: [] },
    { expectedUpdatedAt, createdAt: expectedUpdatedAt },
    { expectedUpdatedAt, ownerUserId: "invalid" },
  ])("rejects %j", (value) =>
    expect(schema.safeParse(value).success).toBe(false),
  );
});
