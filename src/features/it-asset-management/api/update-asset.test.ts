import { afterEach, describe, expect, it, vi } from "vitest";
import { updateAsset } from "./update-asset";
afterEach(() => vi.unstubAllGlobals());
describe("updateAsset", () => {
  it("patches the V2 asset through the same-origin BFF", async () => {
    const asset = { id: "00000000-0000-4000-8000-000000000001", assetCode: "AST-001", name: "Server", assetType: "server", criticality: "high", dataClassification: "confidential", description: null, status: "active", owner: null, updatedAt: "2026-09-29T00:00:00.000Z", createdAt: "2026-09-20T00:00:00.000Z" };
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({ success: true, data: asset }), { status: 200 })); vi.stubGlobal("fetch", fetchMock);
    const input = { name: "Server", assetType: "server", description: null };
    await expect(updateAsset(asset.id, input)).resolves.toMatchObject({ assetCode: "AST-001" });
    expect(fetchMock).toHaveBeenCalledWith(`/api/assets/${asset.id}`, expect.objectContaining({ method: "PATCH", body: JSON.stringify(input) }));
  });
});
