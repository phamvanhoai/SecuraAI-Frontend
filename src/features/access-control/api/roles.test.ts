import { afterEach, describe, expect, it, vi } from "vitest";
import { listRoles } from "./roles";

const emptyList = {
  success: true,
  data: {
    items: [],
    pagination: { page: 1, limit: 20, total: 0, totalPages: 0 },
  },
};

describe("role API", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("refreshes an expired session once and retries the role request", async () => {
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(Response.json({ success: false }, { status: 401 }))
      .mockResolvedValueOnce(Response.json({ success: true }))
      .mockResolvedValueOnce(Response.json(emptyList));
    vi.stubGlobal("fetch", fetchMock);

    await expect(listRoles({ page: 1, limit: 20 })).resolves.toEqual(
      emptyList.data,
    );
    expect(fetchMock).toHaveBeenNthCalledWith(2, "/api/auth/refresh", {
      method: "POST",
    });
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });
});
