import { describe, expect, it } from "vitest";
import { assetTypes, assetTypeLabel } from "./asset-type-schema";
import { createAssetSchema, createAssetRequestSchema } from "./create-asset-schema";
import { updateAssetSchema } from "./update-asset-schema";
import { assetListQuerySchema } from "./asset-list-schema";

describe("asset type catalog boundaries", () => {
  it.each(assetTypes)("accepts %s consistently in create, edit and filters", (assetType) => {
    const identity = { name: "Demo asset", assetType };
    expect(createAssetSchema.parse(identity).assetType).toBe(assetType);
    expect(createAssetRequestSchema.parse({ ...identity, dependencies: [], eventSourceIds: [] }).assetType).toBe(assetType);
    expect(updateAssetSchema.parse({ ...identity, description: "" }).assetType).toBe(assetType);
    expect(assetListQuerySchema.parse({ assetType }).assetType).toBe(assetType);
  });
  it.each(["", " ", "server", "Database Server", "abcxyz", "CLOUD_RESOURCE", "SERVER "])("rejects unsupported type %j", (assetType) => {
    const identity = { name: "Demo asset", assetType };
    expect(createAssetSchema.safeParse(identity).success).toBe(false);
    expect(createAssetRequestSchema.safeParse({ ...identity, dependencies: [], eventSourceIds: [] }).success).toBe(false);
    expect(updateAssetSchema.safeParse({ ...identity, description: "" }).success).toBe(false);
    expect(assetListQuerySchema.safeParse({ assetType }).success).toBe(false);
  });
  it("keeps legacy response values readable without silently reclassifying them", () => {
    expect(assetTypeLabel("NETWORK_DEVICE")).toBe("Network device");
    expect(assetTypeLabel("Legacy type")).toBe("Legacy type");
  });
});
