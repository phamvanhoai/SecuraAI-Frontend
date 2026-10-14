import { describe, expect, it } from "vitest";
import { linkAssetContextSchema, linkAssetContextRequestSchema } from "./link-asset-context-schema";
const id = "11111111-1111-4111-8111-111111111111";
describe("linkAssetContextSchema", () => {
  it("accepts the serialized dependency-only form payload at the HTTP boundary", () => {
    const payload = linkAssetContextSchema.parse({ businessServiceId: "", dependencyIds: [id], eventSourceIds: [] });
    const body: unknown = JSON.parse(JSON.stringify(payload));
    expect(linkAssetContextRequestSchema.parse(body)).toEqual({ businessServiceId: null, dependencyIds: [id], eventSourceIds: [] });
  });
  it.each(["invalid", "", undefined])("rejects invalid service IDs at the HTTP boundary: %s", (businessServiceId) => {
    expect(linkAssetContextRequestSchema.safeParse({ businessServiceId, dependencyIds: [], eventSourceIds: [] }).success).toBe(false);
  });
  it("normalizes an unassigned business service", () => expect(linkAssetContextSchema.parse({ businessServiceId: "", dependencyIds: [id], eventSourceIds: [] })).toEqual({ businessServiceId: null, dependencyIds: [id], eventSourceIds: [] }));
  it("rejects duplicate relationship IDs", () => expect(linkAssetContextSchema.safeParse({ businessServiceId: "", dependencyIds: [id, id], eventSourceIds: [] }).success).toBe(false));
});
