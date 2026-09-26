import { afterEach, describe, expect, it, vi } from "vitest";
import { listAlertThresholds, setAlertThreshold } from "./alert-thresholds";

const threshold = {
  id: "00000000-0000-4000-8000-000000000003",
  asset: {
    id: "00000000-0000-4000-8000-000000000002",
    assetCode: "AST-001",
    name: "Gateway",
  },
  threshold: 0.72,
  riskLevelMin: "high",
  enabled: true,
  updatedByUserId: "00000000-0000-4000-8000-000000000001",
  updatedAt: "2026-09-26T00:00:00.000Z",
};

afterEach(() => vi.unstubAllGlobals());

describe("alert threshold API", () => {
  it("loads the bounded threshold list through the BFF", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      Response.json({
        success: true,
        data: {
          items: [threshold],
          pagination: { page: 1, limit: 100, total: 1, totalPages: 1 },
        },
      }),
    );
    vi.stubGlobal("fetch", fetchMock);

    await expect(listAlertThresholds(1)).resolves.toMatchObject({
      items: [threshold],
    });
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/ai-alerts/thresholds/assets?page=1&limit=100",
      expect.objectContaining({ credentials: "include" }),
    );
  });

  it("saves an asset-specific threshold through the BFF", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(Response.json({ success: true, data: threshold }));
    vi.stubGlobal("fetch", fetchMock);

    await expect(
      setAlertThreshold(threshold.asset.id, {
        threshold: 0.72,
        riskLevelMin: "high",
        enabled: true,
      }),
    ).resolves.toMatchObject({ id: threshold.id });
    expect(fetchMock).toHaveBeenCalledWith(
      `/api/ai-alerts/thresholds/${threshold.asset.id}`,
      expect.objectContaining({ method: "PUT", credentials: "include" }),
    );
  });
});
