import { describe, expect, it } from "vitest";
import { archiveAssetSchema } from "./archive-asset-schema";
describe("archive reason boundary", () => {
  it("trims a valid reason", () => expect(archiveAssetSchema.parse({ confirmationCode: "AST-001", reason: "  Retired after service migration  " })).toEqual({ confirmationCode: "AST-001", reason: "Retired after service migration" }));
  it.each([{}, { confirmationCode: "AST-001", reason: " " }, { confirmationCode: "AST-001", reason: "x".repeat(1001) }, { confirmationCode: "AST-001", reason: "Retired after service migration", archivedBy: "user" }])("rejects invalid or forged metadata %j", (value) => {
    expect(archiveAssetSchema.safeParse(value).success).toBe(false);
  });
});
