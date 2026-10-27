import { afterEach, describe, expect, it, vi } from "vitest";
import { getAssetContextHistory } from "./get-asset-context-history";
afterEach(() => vi.restoreAllMocks());
describe("context history boundary", () => {
  it("forwards pagination and cancellation through same-origin BFF", async () => {
    const data = { items: [], pagination: { page: 2, limit: 10, total: 0, totalPages: 0 } };
    const fetch = vi.spyOn(globalThis, "fetch").mockResolvedValue(Response.json({ success: true, data }));
    const signal = new AbortController().signal;
    expect(await getAssetContextHistory("asset", 2, signal)).toEqual(data);
    expect(fetch).toHaveBeenCalledWith("/api/assets/asset/context/history?page=2&limit=10", expect.objectContaining({ signal }));
  });
  it("rejects malformed snapshots", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(Response.json({ success: true, data: { items: [{}] } }));
    await expect(getAssetContextHistory("asset", 1)).rejects.toMatchObject({ status: 502 });
  });
});
