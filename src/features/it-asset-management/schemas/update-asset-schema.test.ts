import { describe, expect, it } from "vitest";
import { updateAssetSchema } from "./update-asset-schema";
describe("updateAssetSchema", () => {
  it("normalizes editable identity fields", () => { expect(updateAssetSchema.parse({ name: " Server ", assetType: " server ", description: "" })).toEqual({ name: "Server", assetType: "server", description: null }); });
  it("rejects invalid data", () => { expect(updateAssetSchema.safeParse({ name: "", assetType: "server" }).success).toBe(false); });
});
