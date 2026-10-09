import { describe, expect, it } from "vitest";
import {
  incidentAssetOptionsSchema,
  linkIncidentAssetFormSchema,
} from "./incident-asset-schema";

describe("incident asset schemas", () => {
  it("requires a UUID asset selection", () => {
    expect(linkIncidentAssetFormSchema.safeParse({ assetId: "" }).success).toBe(
      false,
    );
    expect(
      linkIncidentAssetFormSchema.safeParse({
        assetId: "33333333-3333-4333-8333-333333333333",
      }).success,
    ).toBe(true);
  });

  it("parses bounded asset options with link state", () => {
    const parsed = incidentAssetOptionsSchema.parse({
      incident: {
        id: "22222222-2222-4222-8222-222222222222",
        incidentCode: "INC-001",
        title: "Suspicious login",
        status: "open",
      },
      assets: [
        {
          id: "33333333-3333-4333-8333-333333333333",
          assetCode: "AST-001",
          name: "VPN Gateway",
          assetType: "gateway",
          criticality: "critical",
          linked: false,
        },
      ],
      pagination: { page: 1, limit: 10, total: 1, totalPages: 1 },
    });
    expect(parsed.assets[0]?.linked).toBe(false);
  });
});
