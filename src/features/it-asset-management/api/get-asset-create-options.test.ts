import { afterEach, describe, expect, it, vi } from "vitest";
import { getAssetCreateOptions } from "./get-asset-create-options";

afterEach(() => vi.unstubAllGlobals());
describe("getAssetCreateOptions", () => {
  it("loads safe V2 reference options through the BFF", async () => {
    const data = { owners: [{ id: "00000000-0000-4000-8000-000000000020", fullName: "Asset Owner", role: "EMPLOYEE" }], businessServices: [], assets: [], eventSources: [], departments: [], truncated: { departments: false, owners: false } };
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({ success: true, data }), { status: 200 })); vi.stubGlobal("fetch", fetchMock);
    await expect(getAssetCreateOptions()).resolves.toEqual(data);
    expect(fetchMock).toHaveBeenCalledWith("/api/assets/create-options", expect.objectContaining({ credentials: "include" }));
  });
  it("rejects an unsafe backend response", async () => { vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(JSON.stringify({ success: true, data: { owners: [] } }), { status: 200 }))); await expect(getAssetCreateOptions()).rejects.toMatchObject({ status: 502 }); });
});
