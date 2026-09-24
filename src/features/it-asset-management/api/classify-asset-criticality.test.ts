import { afterEach, describe, expect, it, vi } from "vitest";
import { classifyAssetCriticality } from "./classify-asset-criticality";

afterEach(() => vi.restoreAllMocks());

describe("classifyAssetCriticality", () => {
  it("posts criteria through the same-origin BFF", async () => {
    const assetId = "00000000-0000-4000-8000-000000000001";
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({
          success: true,
          data: {
            assetId,
            previousCriticality: "medium",
            criticality: "critical",
            score: 4.55,
            changed: true,
            classifiedAt: "2026-09-10T10:00:00.000Z",
          },
        }),
        { status: 200 },
      ),
    );
    const input = {
      confidentialityImpact: 5,
      integrityImpact: 4,
      availabilityImpact: 5,
      businessImpact: 4,
      reason: "Production database",
    };

    const result = await classifyAssetCriticality(assetId, input);

    expect(result).toMatchObject({ criticality: "critical", score: 4.55 });
    expect(fetchMock).toHaveBeenCalledWith(
      `/api/assets/${assetId}/classify-criticality`,
      expect.objectContaining({
        method: "POST",
        credentials: "include",
        body: JSON.stringify(input),
      }),
    );
  });
});
