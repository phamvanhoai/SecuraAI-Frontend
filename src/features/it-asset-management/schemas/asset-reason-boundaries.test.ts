import { describe, expect, it } from "vitest";
import { archiveAssetSchema } from "./archive-asset-schema";
import { assignAssetOwnerSchema } from "./assign-asset-owner-schema";
import { deactivateBusinessServiceSchema } from "./deactivate-business-service-schema";
describe("archiveAssetSchema reason boundaries", () => {
  const fields = {};
  it.each(["", " ", "a".repeat(19), " " + "a".repeat(19) + " "]) ("rejects short reason %j", (reason) => {
    expect(archiveAssetSchema.safeParse({ ...fields, reason }).success).toBe(false);
  });
  it.each([20, 1000])("accepts %i characters after trimming", (length) => {
    expect(archiveAssetSchema.parse({ ...fields, reason: "  " + "a".repeat(length) + "  " }).reason).toBe("a".repeat(length));
  });
  it("rejects a reason over the maximum", () => {
    expect(archiveAssetSchema.safeParse({ ...fields, reason: "a".repeat(1001) }).success).toBe(false);
  });
});
describe("assignAssetOwnerSchema reason boundaries", () => {
  const fields = { ownerUserId: null };
  it.each(["", " ", "a".repeat(19), " " + "a".repeat(19) + " "]) ("rejects short reason %j", (reason) => {
    expect(assignAssetOwnerSchema.safeParse({ ...fields, reason }).success).toBe(false);
  });
  it.each([20, 1000])("accepts %i characters after trimming", (length) => {
    expect(assignAssetOwnerSchema.parse({ ...fields, reason: "  " + "a".repeat(length) + "  " }).reason).toBe("a".repeat(length));
  });
  it("rejects a reason over the maximum", () => {
    expect(assignAssetOwnerSchema.safeParse({ ...fields, reason: "a".repeat(1001) }).success).toBe(false);
  });
});
describe("deactivateBusinessServiceSchema reason boundaries", () => {
  const fields = { expectedUpdatedAt: "2026-11-10T00:00:00Z", confirmationName: "Demo service" };
  it.each(["", " ", "a".repeat(19), " " + "a".repeat(19) + " "]) ("rejects short reason %j", (reason) => {
    expect(deactivateBusinessServiceSchema.safeParse({ ...fields, reason }).success).toBe(false);
  });
  it.each([20, 2000])("accepts %i characters after trimming", (length) => {
    expect(deactivateBusinessServiceSchema.parse({ ...fields, reason: "  " + "a".repeat(length) + "  " }).reason).toBe("a".repeat(length));
  });
  it("rejects a reason over the maximum", () => {
    expect(deactivateBusinessServiceSchema.safeParse({ ...fields, reason: "a".repeat(2001) }).success).toBe(false);
  });
});
