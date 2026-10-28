import { afterEach, expect, it, vi } from "vitest";
import { getAssetOwnerOptions } from "./get-asset-owner-options";
afterEach(() => vi.unstubAllGlobals());
it("passes bounded search and cancellation to the authenticated BFF", async () => {
  const fetcher = vi.fn().mockResolvedValue(Response.json({ success: true, data: { items: [] } }));
  vi.stubGlobal("fetch", fetcher);
  const signal = new AbortController().signal;
  await expect(getAssetOwnerOptions("second@", signal)).resolves.toEqual({ items: [] });
  expect(fetcher).toHaveBeenCalledWith("/api/assets/owner-options?q=second%40", expect.objectContaining({ signal, cache: "no-store" }));
});
it("rejects responses without email", async () => {
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue(Response.json({ success: true, data: { items: [{ id: "00000000-0000-4000-8000-000000000001", fullName: "Owner" }] } })));
  await expect(getAssetOwnerOptions("", new AbortController().signal)).rejects.toMatchObject({ status: 502 });
});
