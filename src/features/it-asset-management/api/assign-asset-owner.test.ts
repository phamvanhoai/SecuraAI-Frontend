import { afterEach, describe, expect, it, vi } from "vitest";
import { assignAssetOwner } from "./assign-asset-owner";

afterEach(() => vi.restoreAllMocks());

describe("assignAssetOwner", () => {
  it("puts the assignment through the same-origin BFF", async () => {
    const assetId = "00000000-0000-4000-8000-000000000001";
    const ownerUserId = "00000000-0000-4000-8000-000000000002";
    const input = { ownerUserId, reason: "Bàn giao vận hành máy chủ" };
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({
          success: true,
          data: {
            assetId,
            previousOwner: null,
            owner: { id: ownerUserId, fullName: "Nguyễn Văn A" },
            changed: true,
            assignedAt: "2026-09-10T10:00:00.000Z",
          },
        }),
        { status: 200 },
      ),
    );

    await expect(assignAssetOwner(assetId, input)).resolves.toMatchObject({ changed: true });
    expect(fetchMock).toHaveBeenCalledWith(
      `/api/assets/${assetId}/owner`,
      expect.objectContaining({
        method: "PUT",
        credentials: "include",
        body: JSON.stringify(input),
      }),
    );
  });
});
