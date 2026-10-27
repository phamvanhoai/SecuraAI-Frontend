import { beforeEach, describe, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({ proxy: vi.fn() }));
vi.mock("@/lib/api/backend-proxy", () => ({
  proxyAuthenticatedRequest: mocks.proxy,
}));
import { GET } from "./route";
const id = "11111111-1111-4111-8111-111111111111";
beforeEach(() => vi.clearAllMocks());
describe("history BFF", () => {
  it("forwards only bounded query parameters to authenticated proxy", async () => {
    mocks.proxy.mockResolvedValue(Response.json({ success: true }));
    await GET(new Request("http://localhost/api/history?page=2&limit=20"), {
      params: Promise.resolve({ assetId: id }),
    });
    expect(mocks.proxy).toHaveBeenCalledWith(
      `/assets/${id}/context/history?page=2&limit=20`,
    );
  });
  it.each(["limit=101", "page=0", "actorId=forged"])(
    "rejects %s",
    async (query) => {
      expect(
        (
          await GET(new Request(`http://localhost/api/history?${query}`), {
            params: Promise.resolve({ assetId: id }),
          })
        ).status,
      ).toBe(422);
      expect(mocks.proxy).not.toHaveBeenCalled();
    },
  );
});
