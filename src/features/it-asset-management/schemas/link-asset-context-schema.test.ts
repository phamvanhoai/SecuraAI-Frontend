import { describe, expect, it } from "vitest";
import { linkAssetContextSchema } from "./link-asset-context-schema";
const id = "11111111-1111-4111-8111-111111111111";
describe("linkAssetContextSchema", () => {
  it("normalizes an unassigned business service", () => expect(linkAssetContextSchema.parse({ businessServiceId: "", dependencyIds: [id], eventSourceIds: [] })).toEqual({ businessServiceId: null, dependencyIds: [id], eventSourceIds: [] }));
  it("rejects duplicate relationship IDs", () => expect(linkAssetContextSchema.safeParse({ businessServiceId: "", dependencyIds: [id, id], eventSourceIds: [] }).success).toBe(false));
});
