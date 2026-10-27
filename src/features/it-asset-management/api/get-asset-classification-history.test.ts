import { afterEach, describe, expect, it, vi } from "vitest";
import { getAssetClassificationHistory } from "./get-asset-classification-history";
afterEach(() => vi.restoreAllMocks());
describe("classification history boundary", () => {
  it("forwards pagination and cancellation through same-origin BFF", async () => {
    const data = {
      items: [],
      pagination: { page: 2, limit: 10, total: 0, totalPages: 0 },
    };
    const fetch = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(Response.json({ success: true, data }));
    const signal = new AbortController().signal;
    expect(await getAssetClassificationHistory("asset", 2, signal)).toEqual(
      data,
    );
    expect(fetch).toHaveBeenCalledWith(
      "/api/assets/asset/classify-criticality/history?page=2&limit=10",
      expect.objectContaining({ signal }),
    );
  });
  it("rejects malformed snapshots", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      Response.json({ success: true, data: { items: [{}] } }),
    );
    await expect(
      getAssetClassificationHistory("asset", 1),
    ).rejects.toMatchObject({ status: 502 });
  });
});
