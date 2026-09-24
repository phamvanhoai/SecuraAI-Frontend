import { afterEach, describe, expect, it, vi } from "vitest";
import { deleteLogSource, listLogSources } from "./log-sources";

describe("listLogSources", () => {
  afterEach(() => vi.unstubAllGlobals());
  it("loads and validates the backend list envelope", async () => {
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(
      Response.json({
        success: true,
        data: {
          items: [],
          pagination: { page: 1, limit: 20, total: 0, totalPages: 0 },
        },
      }),
    );
    vi.stubGlobal("fetch", fetchMock);
    await expect(listLogSources({ page: 1, limit: 20 })).resolves.toMatchObject(
      { items: [], pagination: { total: 0 } },
    );
    expect(String(fetchMock.mock.calls[0]?.[0])).toContain(
      "/api/security-monitoring/log-sources?page=1&limit=20",
    );
  });

  it("deletes a log source through the same-origin BFF", async () => {
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(
      new Response(null, {
        status: 204,
      }),
    );
    vi.stubGlobal("fetch", fetchMock);

    await expect(
      deleteLogSource("00000000-0000-4000-8000-000000000001"),
    ).resolves.toBeUndefined();
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/security-monitoring/log-sources/00000000-0000-4000-8000-000000000001",
      expect.objectContaining({ method: "DELETE", credentials: "include" }),
    );
  });
});
