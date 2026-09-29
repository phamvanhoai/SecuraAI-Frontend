import { describe, expect, it } from "vitest";
import { createAssetSchema } from "./create-asset-schema";

describe("createAssetSchema", () => {
  it("normalizes core fields and supplies relationship defaults", () => {
    expect(
      createAssetSchema.parse({
        assetCode: " ast-002 ",
        name: " Server ",
        assetType: " server ",
        criticality: "medium",
        dataClassification: "internal",
      }),
    ).toEqual({
      assetCode: "AST-002",
      name: "Server",
      assetType: "server",
      businessServiceId: undefined,
      ownerUserId: undefined,
      criticality: "medium",
      dataClassification: "internal",
      description: undefined,
      dependencyIds: [],
      eventSourceIds: [],
    });
  });
  it("accepts owner, service, dependency and event-source IDs", () => {
    const ownerUserId = "00000000-0000-4000-8000-000000000020";
    const businessServiceId = "00000000-0000-4000-8000-000000000030";
    const relatedId = "00000000-0000-4000-8000-000000000040";
    expect(
      createAssetSchema.parse({
        assetCode: "AST-002",
        name: "Server",
        assetType: "server",
        criticality: "high",
        dataClassification: "confidential",
        ownerUserId,
        businessServiceId,
        dependencyIds: [relatedId],
        eventSourceIds: [relatedId],
      }),
    ).toMatchObject({
      ownerUserId,
      businessServiceId,
      dependencyIds: [relatedId],
      eventSourceIds: [relatedId],
    });
  });
  it("rejects invalid identifiers and unknown fields", () => {
    expect(
      createAssetSchema.safeParse({
        assetCode: "AST-002",
        name: "Server",
        assetType: "server",
        criticality: "high",
        dataClassification: "internal",
        ownerUserId: "invalid",
        hostname: "legacy",
      }).success,
    ).toBe(false);
  });
});
