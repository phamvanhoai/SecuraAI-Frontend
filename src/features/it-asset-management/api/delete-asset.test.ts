import { afterEach, describe, expect, it, vi } from "vitest";
import { deleteAsset } from "./delete-asset";

afterEach(() => vi.restoreAllMocks());

describe("deleteAsset", () => {
  it("sends DELETE through the same-origin BFF and accepts 204", async () => {
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(new Response(null, { status: 204 }));

    await expect(
      deleteAsset("00000000-0000-4000-8000-000000000001"),
    ).resolves.toBeUndefined();
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/assets/00000000-0000-4000-8000-000000000001",
      expect.objectContaining({ method: "DELETE", credentials: "include" }),
    );
  });

  it("preserves a backend dependency conflict", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({
          success: false,
          error: {
            code: "ASSET_HAS_ACTIVE_DEPENDENCIES",
            message: "Asset is being used by active business records",
          },
        }),
        { status: 409 },
      ),
    );

    await expect(deleteAsset("00000000-0000-4000-8000-000000000001")).rejects.toMatchObject({
      status: 409,
      code: "CONFLICT",
    });
  });
});
