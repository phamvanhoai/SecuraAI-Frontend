import { describe, expect, it } from "vitest";
import {
  businessServiceListQuerySchema,
  businessServiceSchema,
  businessServiceAssetsSchema,
} from "./business-service-schema";
describe("Business service boundary", () => {
  it("defaults and trims bounded filters", () => {
    expect(businessServiceListQuerySchema.parse({ q: " support " })).toEqual({
      page: 1,
      limit: 10,
      q: "support",
    });
  });
  it.each([
    { page: 0 },
    { limit: 101 },
    { page: 100001 },
    { q: "a".repeat(101) },
    { status: "archived" },
    { owner: "someone" },
  ])("rejects invalid filters %j", (query) => {
    expect(businessServiceListQuerySchema.safeParse(query).success).toBe(false);
  });
  it("does not accept incomplete service or linked assets", () => {
    expect(businessServiceSchema.safeParse({ name: "Service" }).success).toBe(
      false,
    );
    expect(
      businessServiceAssetsSchema.safeParse({
        items: [{ id: "invalid", status: "active" }],
      }).success,
    ).toBe(false);
  });
});
