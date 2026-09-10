import { describe, expect, it } from "vitest";
import { createAssetSchema } from "./create-asset-schema";

describe("createAssetSchema", () => {
  it("normalizes the code, trims fields and removes blank optional values", () => {
    expect(
      createAssetSchema.parse({
        assetCode: " ast-002 ",
        name: " Server ",
        assetType: " server ",
        description: "",
        criticality: "medium",
        hostname: "",
        ipAddress: "",
        location: "",
      }),
    ).toEqual({
      assetCode: "AST-002",
      name: "Server",
      assetType: "server",
      description: undefined,
      criticality: "medium",
      hostname: undefined,
      ipAddress: undefined,
      location: undefined,
    });
  });

  it.each([
    {
      assetCode: "BAD CODE",
      name: "Server",
      assetType: "server",
      criticality: "medium",
      description: "",
      hostname: "",
      ipAddress: "",
      location: "",
    },
    {
      assetCode: "AST-002",
      name: "",
      assetType: "server",
      criticality: "medium",
      description: "",
      hostname: "",
      ipAddress: "",
      location: "",
    },
    {
      assetCode: "AST-002",
      name: "Server",
      assetType: "server",
      criticality: "urgent",
      description: "",
      hostname: "",
      ipAddress: "",
      location: "",
    },
    {
      assetCode: "AST-002",
      name: "Server",
      assetType: "server",
      criticality: "medium",
      description: "",
      hostname: "",
      ipAddress: "999.1.1.1",
      location: "",
    },
  ])("rejects invalid asset input", (input) => {
    expect(createAssetSchema.safeParse(input).success).toBe(false);
  });
});
