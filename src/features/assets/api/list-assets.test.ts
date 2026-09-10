import { afterEach, describe, expect, it, vi } from "vitest";
import { listAssets } from "./list-assets";

afterEach(() => vi.unstubAllGlobals());

describe("listAssets", () => {
  it("calls the same-origin BFF and validates the backend envelope", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          success: true,
          data: {
            items: [],
            pagination: { page: 2, limit: 20, total: 0, totalPages: 0 },
          },
        }),
        { status: 200, headers: { "content-type": "application/json" } },
      ),
    );
    vi.stubGlobal("fetch", fetchMock);

    await expect(
      listAssets({ page: 2, limit: 20, sortBy: "assetCode", sortOrder: "asc" }),
    ).resolves.toMatchObject({ pagination: { page: 2 } });
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/assets?page=2&limit=20&sortBy=assetCode&sortOrder=asc",
      expect.objectContaining({ credentials: "include", method: "GET" }),
    );
  });

  it("rejects a successful response that violates the asset contract", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            success: true,
            data: { items: [{ status: "invalid" }], pagination: {} },
          }),
          { status: 200 },
        ),
      ),
    );

    await expect(
      listAssets({ page: 1, limit: 20, sortBy: "assetCode", sortOrder: "asc" }),
    ).rejects.toMatchObject({ status: 502, code: "UNKNOWN_ERROR" });
  });
});
