import { afterEach, describe, expect, it, vi } from "vitest";
import { linkAssetContext } from "./link-asset-context";
afterEach(() => vi.restoreAllMocks());
describe("linkAssetContext", () => {
  it("updates relationships through the same-origin BFF", async () => {
    const assetId = "11111111-1111-4111-8111-111111111111"; const relatedId = "22222222-2222-4222-8222-222222222222";
    const input = { businessServiceId: relatedId, dependencyIds: [relatedId], eventSourceIds: [] };
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response(JSON.stringify({ success: true, data: { assetId, ...input, linkedAt: "2026-09-30T07:00:00.000Z" } }), { status: 200 }));
    await expect(linkAssetContext(assetId, input)).resolves.toMatchObject({ assetId, ...input });
    expect(fetchMock).toHaveBeenCalledWith(`/api/assets/${assetId}/context`, expect.objectContaining({ method: "PUT", body: JSON.stringify(input) }));
  });
});
