import { describe, expect, it } from "vitest";
import {
  createBusinessServiceSchema as schema,
  businessServiceOwnersSchema,
} from "./create-business-service-schema";
describe("Service creation contract", () => {
  it("normalizes whitespace and allows missing or null owner", () => {
    expect(schema.parse({ name: " Support  Service " })).toEqual({
      name: "Support Service",
    });
    expect(
      schema.safeParse({ name: "Support", ownerUserId: null }).success,
    ).toBe(true);
  });
  it.each([
    { name: " " },
    { name: "a".repeat(256) },
    { name: "Support", description: "a".repeat(5001) },
    { name: "Support", ownerUserId: "" },
    { name: "Support", status: "active" },
    { name: "Support", assets: [] },
  ])("rejects invalid input %j", (value) => {
    expect(schema.safeParse(value).success).toBe(false);
  });
  it("bounds the owner dropdown to ten", () => {
    expect(
      businessServiceOwnersSchema.safeParse({
        items: Array.from({ length: 11 }, () => ({
          id: "00000000-0000-4000-8000-000000000001",
          fullName: "Owner",
          role: "EMPLOYEE",
        })),
      }).success,
    ).toBe(false);
  });
});
