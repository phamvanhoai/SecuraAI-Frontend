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
        hostname: "",
        ipAddress: "",
        location: "",
        departmentId: "",
        ownerUserId: "",
      }),
    ).toEqual({
      assetCode: "AST-002",
      name: "Server",
      assetType: "server",
      description: undefined,
      hostname: undefined,
      ipAddress: undefined,
      location: undefined,
      departmentId: undefined,
      ownerUserId: undefined,
    });
  });

  it("accepts valid optional department and owner IDs", () => {
    const departmentId = "00000000-0000-4000-8000-000000000010";
    const ownerUserId = "00000000-0000-4000-8000-000000000020";
    expect(
      createAssetSchema.parse({
        assetCode: "AST-002",
        name: "Server",
        assetType: "server",
        departmentId,
        ownerUserId,
      }),
    ).toMatchObject({ departmentId, ownerUserId });
  });

  it("rejects invalid department and owner IDs", () => {
    expect(
      createAssetSchema.safeParse({
        assetCode: "AST-002",
        name: "Server",
        assetType: "server",
        departmentId: "not-a-uuid",
      }).success,
    ).toBe(false);
  });

  it.each([
    {
      assetCode: "BAD CODE",
      name: "Server",
      assetType: "server",
      description: "",
      hostname: "",
      ipAddress: "",
      location: "",
    },
    {
      assetCode: "AST-002",
      name: "",
      assetType: "server",
      description: "",
      hostname: "",
      ipAddress: "",
      location: "",
    },
    {
      assetCode: "AST-002",
      name: "Server",
      assetType: "server",
      criticality: "critical",
      description: "",
      hostname: "",
      ipAddress: "",
      location: "",
    },
    {
      assetCode: "AST-002",
      name: "Server",
      assetType: "server",
      description: "",
      hostname: "",
      ipAddress: "999.1.1.1",
      location: "",
    },
  ])("rejects invalid asset input", (input) => {
    expect(createAssetSchema.safeParse(input).success).toBe(false);
  });
});
