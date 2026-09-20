import { afterEach, describe, expect, it, vi } from "vitest";
import { listLoginHistory } from "./list-login-history";
import { loginHistoryQuerySchema } from "../schemas/login-history-schema";
afterEach(() => vi.unstubAllGlobals());
describe("list login history API", () => {
  it("validates server data and preserves abort signals", async () => {
    const data = {
      items: [],
      pagination: { page: 1, limit: 20, total: 0, totalPages: 0 },
    };
    const fetcher = vi.fn(async () => Response.json({ success: true, data }));
    vi.stubGlobal("fetch", fetcher);
    const controller = new AbortController();
    await expect(
      listLoginHistory(loginHistoryQuerySchema.parse({}), controller.signal),
    ).resolves.toEqual(data);
    expect(fetcher).toHaveBeenCalledWith(
      expect.stringContaining("/api/login-history?"),
      expect.objectContaining({
        method: "GET",
        credentials: "include",
        signal: controller.signal,
      }),
    );
  });
  it("reports malformed responses with a generic error", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        Response.json({
          success: true,
          data: { items: "private internal payload" },
        }),
      ),
    );
    await expect(
      listLoginHistory(loginHistoryQuerySchema.parse({})),
    ).rejects.toMatchObject({
      status: 502,
      message: "Unable to read login history. Please try again.",
    });
  });
});
