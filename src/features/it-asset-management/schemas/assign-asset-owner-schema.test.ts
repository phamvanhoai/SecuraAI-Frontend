import { describe, expect, it } from "vitest";
import { assignAssetOwnerSchema } from "./assign-asset-owner-schema";

describe("assignAssetOwnerSchema", () => {
  it("normalizes an empty owner selection into an unassignment request", () => {
    expect(assignAssetOwnerSchema.parse({ ownerUserId: "", reason: "  Bàn giao lại tài sản  " })).toEqual({
      ownerUserId: null,
      reason: "Bàn giao lại tài sản",
    });
  });

  it("requires a valid owner ID or null and a reason", () => {
    expect(
      assignAssetOwnerSchema.safeParse({ ownerUserId: "not-a-uuid", reason: "Assign" }).success,
    ).toBe(false);
    expect(assignAssetOwnerSchema.safeParse({ ownerUserId: null, reason: " " }).success).toBe(false);
  });
});
