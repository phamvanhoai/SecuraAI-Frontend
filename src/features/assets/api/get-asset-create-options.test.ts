import { afterEach, describe, expect, it, vi } from "vitest";
import { getAssetCreateOptions } from "./get-asset-create-options";

afterEach(() => vi.unstubAllGlobals());

describe("getAssetCreateOptions", () => {
  it("loads and validates safe create options through the same-origin BFF", async () => {
    const data = {
      departments: [
        {
          id: "00000000-0000-4000-8000-000000000010",
          code: "IT",
          name: "Công nghệ thông tin",
        },
      ],
      owners: [
        {
          id: "00000000-0000-4000-8000-000000000020",
          fullName: "Nguyễn Văn A",
          employeeCode: "EMP-001",
        },
      ],
      truncated: { departments: false, owners: false },
    };
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ success: true, data }), { status: 200 }),
    );
    vi.stubGlobal("fetch", fetchMock);

    await expect(getAssetCreateOptions()).resolves.toEqual(data);
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/assets/create-options",
      expect.objectContaining({ credentials: "include" }),
    );
  });

  it("rejects an unsafe backend response", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({ success: true, data: { departments: [], owners: [] } }),
          { status: 200 },
        ),
      ),
    );

    await expect(getAssetCreateOptions()).rejects.toMatchObject({ status: 502 });
  });
});
