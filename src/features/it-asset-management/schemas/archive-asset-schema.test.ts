import { describe, expect, it } from "vitest";
import { archiveAssetSchema } from "./archive-asset-schema";
describe("archive reason boundary", () => {
  it("trims a valid reason", () => expect(archiveAssetSchema.parse({ reason: "  Retired  " })).toEqual({ reason: "Retired" }));
  it.each([{}, { reason: " " }, { reason: "x".repeat(1001) }, { reason: "Retired", archivedBy: "user" }])("rejects invalid or forged metadata %j", (value) => {
    expect(archiveAssetSchema.safeParse(value).success).toBe(false);
  });
});
