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
            previousDataClassification: "internal",
            dataClassification: "restricted",
            dataClassificationBasis:
              "Only approved public information is handled; no sensitive records are stored.",
            rationale:
              "Disclosure of customer records would cause severe business harm.",
            score: 5,
            methodVersion: "SECURAAI-ASSET-IMPACT-v1",
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
      dataClassification: "restricted" as const,
      dataClassificationBasis:
        "Only approved public information is handled; no sensitive records are stored.",
      rationale:
        "Disclosure of customer records would cause severe business harm.",
    };

    const result = await classifyAssetCriticality(assetId, input);

    expect(result).toMatchObject({ criticality: "critical", score: 5 });
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
