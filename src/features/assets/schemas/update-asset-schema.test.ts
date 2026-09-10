import { describe, expect, it } from "vitest";
import { updateAssetSchema } from "./update-asset-schema";

describe("updateAssetSchema", () => {
  it("normalizes editable fields and clears blank optional values", () => {
    expect(
      updateAssetSchema.parse({
        name: " Updated Server ",
        assetType: " server ",
        description: "",
        hostname: " fe-test-server ",
        ipAddress: "",
        location: " Server Room ",
        status: "active",
      }),
    ).toEqual({
      name: "Updated Server",
      assetType: "server",
      description: null,
      hostname: "fe-test-server",
      ipAddress: null,
      location: "Server Room",
      status: "active",
    });
  });

  it("rejects invalid IPs, status and direct criticality changes", () => {
    const base = {
      name: "Server",
      assetType: "server",
      description: "",
      hostname: "",
      ipAddress: "invalid",
      location: "",
      status: "deleted",
    };
    expect(updateAssetSchema.safeParse(base).success).toBe(false);
    expect(
      updateAssetSchema.safeParse({
        ...base,
        ipAddress: "",
        status: "active",
        criticality: "critical",
      }).success,
    ).toBe(false);
  });
});
