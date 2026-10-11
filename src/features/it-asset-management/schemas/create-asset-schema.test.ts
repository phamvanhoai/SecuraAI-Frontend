import { describe, expect, it } from "vitest";
import { createAssetSchema, createAssetRequestSchema } from "./create-asset-schema";
const identity = { assetCode: " ast-002 ", name: " Server ", assetType: " server " };
describe("createAssetSchema", () => {
  it("normalizes identity without assigning classification or service", () => {
    expect(createAssetSchema.parse(identity)).toEqual({
      assetCode: "AST-002", name: "Server", assetType: "server",
      dependencyIds: [], eventSourceIds: [],
    });
  });
  it.each(["criticality", "dataClassification", "businessServiceId"])("rejects deferred field %s in form and request", (field) => {
    expect(createAssetSchema.safeParse({ ...identity, [field]: "medium" }).success).toBe(false);
    expect(createAssetRequestSchema.safeParse({ ...identity, dependencies: [], eventSourceIds: [], [field]: null }).success).toBe(false);
  });
  it("accepts an optional owner and description", () => {
    const ownerUserId = "00000000-0000-4000-8000-000000000020";
    expect(createAssetSchema.parse({ ...identity, ownerUserId, description: " Example " })).toMatchObject({ ownerUserId, description: "Example" });
  });
  it("rejects invalid owners and missing identity", () => {
    expect(createAssetSchema.safeParse({ ...identity, ownerUserId: "invalid" }).success).toBe(false);
    expect(createAssetSchema.safeParse({ ...identity, name: "" }).success).toBe(false);
  });
});
