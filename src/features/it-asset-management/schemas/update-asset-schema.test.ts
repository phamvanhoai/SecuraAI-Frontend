import { describe, expect, it } from "vitest";
import { updateAssetSchema } from "./update-asset-schema";
describe("updateAssetSchema", () => {
  it("normalizes nullable fields", () => { expect(updateAssetSchema.parse({ name: " Server ", assetType: " server ", ownerUserId: "", businessServiceId: "", criticality: "high", dataClassification: "confidential", description: "", dependencyIds: [], eventSourceIds: [] })).toMatchObject({ name: "Server", ownerUserId: null, businessServiceId: null, description: null }); });
  it("rejects invalid data", () => { expect(updateAssetSchema.safeParse({ name: "", assetType: "server" }).success).toBe(false); });
});
