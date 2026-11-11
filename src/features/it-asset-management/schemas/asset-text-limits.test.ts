import { describe, expect, it } from "vitest";
import { createAssetSchema } from "./create-asset-schema";
import { createAssetRequestSchema } from "./create-asset-schema";
import { updateAssetSchema } from "./update-asset-schema";
describe("createAssetSchema text limits", () => {
  const fields = { name: "CRM", assetType: "SERVER" };
  it.each([2, 101])("rejects name length %i after trimming", (length) => {
    expect(createAssetSchema.safeParse({ ...fields, name: "  " + "a".repeat(length) + "  " }).success).toBe(false);
  });
  it.each([3, 100])("accepts name length %i", (length) => {
    expect(createAssetSchema.parse({ ...fields, name: "  " + "a".repeat(length) + "  " }).name).toBe("a".repeat(length));
  });
  it.each([1, 19, 2001])("rejects description length %i after trimming", (length) => {
    expect(createAssetSchema.safeParse({ ...fields, description: "  " + "a".repeat(length) + "  " }).success).toBe(false);
  });
  it.each([0, 20, 2000])("accepts blank or valid description length %i", (length) => {
    expect(createAssetSchema.safeParse({ ...fields, description: "  " + "a".repeat(length) + "  " }).success).toBe(true);
  });
});
describe("createAssetRequestSchema text limits", () => {
  const fields = { name: "CRM", assetType: "SERVER", dependencies: [], eventSourceIds: [] };
  it.each([2, 101])("rejects name length %i after trimming", (length) => {
    expect(createAssetRequestSchema.safeParse({ ...fields, name: "  " + "a".repeat(length) + "  " }).success).toBe(false);
  });
  it.each([3, 100])("accepts name length %i", (length) => {
    expect(createAssetRequestSchema.parse({ ...fields, name: "  " + "a".repeat(length) + "  " }).name).toBe("a".repeat(length));
  });
  it.each([1, 19, 2001])("rejects description length %i after trimming", (length) => {
    expect(createAssetRequestSchema.safeParse({ ...fields, description: "  " + "a".repeat(length) + "  " }).success).toBe(false);
  });
  it.each([0, 20, 2000])("accepts blank or valid description length %i", (length) => {
    expect(createAssetRequestSchema.safeParse({ ...fields, description: "  " + "a".repeat(length) + "  " }).success).toBe(true);
  });
});
describe("updateAssetSchema text limits", () => {
  const fields = { name: "CRM", assetType: "SERVER", description: "" };
  it.each([2, 101])("rejects name length %i after trimming", (length) => {
    expect(updateAssetSchema.safeParse({ ...fields, name: "  " + "a".repeat(length) + "  " }).success).toBe(false);
  });
  it.each([3, 100])("accepts name length %i", (length) => {
    expect(updateAssetSchema.parse({ ...fields, name: "  " + "a".repeat(length) + "  " }).name).toBe("a".repeat(length));
  });
  it.each([1, 19, 2001])("rejects description length %i after trimming", (length) => {
    expect(updateAssetSchema.safeParse({ ...fields, description: "  " + "a".repeat(length) + "  " }).success).toBe(false);
  });
  it.each([0, 20, 2000])("accepts blank or valid description length %i", (length) => {
    expect(updateAssetSchema.safeParse({ ...fields, description: "  " + "a".repeat(length) + "  " }).success).toBe(true);
  });
});
