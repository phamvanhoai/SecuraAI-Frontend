import { afterEach, expect, it, vi } from "vitest";
import { getAssetDependencyOptions } from "./get-asset-dependency-options";
afterEach(() => vi.unstubAllGlobals());
const id = "00000000-0000-4000-8000-000000000001";
it("forwards search and abort signal", async () => {
 const fetcher = vi.fn().mockResolvedValue(Response.json({ success: true, data: { items: [] } }));
 vi.stubGlobal("fetch", fetcher);
 const signal = new AbortController().signal;
 await expect(getAssetDependencyOptions(id, "AST-B", signal)).resolves.toEqual({ items: [] });
 expect(fetcher).toHaveBeenCalledWith(`/api/assets/${id}/dependency-options?q=AST-B`, expect.objectContaining({ signal, cache: "no-store" }));
});
it("rejects an option missing server eligibility rather than enabling it", async () => {
 vi.stubGlobal("fetch", vi.fn().mockResolvedValue(Response.json({ success: true, data: { items: [{ id, assetCode: "AST-B", name: "B", status: "active" }] } })));
 await expect(getAssetDependencyOptions(id, "", new AbortController().signal)).rejects.toMatchObject({ status: 502 });
});
