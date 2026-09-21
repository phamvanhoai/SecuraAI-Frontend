import { beforeEach, describe, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({
  request: vi.fn(),
  set: vi.fn(),
  clear: vi.fn(),
}));
vi.mock("@/lib/auth/authenticated-request", () => ({
  authenticatedRequest: mocks.request,
}));
vi.mock("@/lib/auth/auth-cookies", () => ({
  setAuthCookies: mocks.set,
  clearAuthCookies: mocks.clear,
}));
import { GET } from "./route";
beforeEach(() => vi.clearAllMocks());
describe("login history BFF", () => {
  it("forwards validated GET parameters and retains rotated HttpOnly cookies", async () => {
    const tokens = {
      accessToken: "access",
      refreshToken: "refresh",
      expiresIn: "15m",
    };
    mocks.request.mockResolvedValue({
      response: Response.json({ success: true, data: { items: [] } }),
      refreshedTokens: tokens,
    });
    const request = new Request(
      "http://frontend.test/api/login-history?search=Admin&status=failed",
    );
    const response = await GET(request);
    expect(response.status).toBe(200);
    const forwarded = String(mocks.request.mock.calls[0]?.[0]);
    expect(
      new URL(forwarded, "http://backend.test").searchParams.get("search"),
    ).toBe("Admin");
    expect(mocks.request).toHaveBeenCalledWith(
      expect.stringContaining("/login-history?"),
      { method: "GET", signal: request.signal },
      request,
    );
    expect(mocks.set).toHaveBeenCalledWith(response, tokens);
    expect(response.headers.get("cache-control")).toBe("no-store");
  });
  it.each([
    "limit=101",
    "page=0",
    "search=a&search=b",
    "token=secret",
    "ipAddress=hostname",
  ])("rejects %s before forwarding", async (query) => {
    expect(
      (
        await GET(
          new Request(`http://frontend.test/api/login-history?${query}`),
        )
      ).status,
    ).toBe(422);
    expect(mocks.request).not.toHaveBeenCalled();
  });
  it.each([401, 403])("preserves backend %s", async (status) => {
    mocks.request.mockResolvedValue({
      response: Response.json({ success: false }, { status }),
    });
    const response = await GET(
      new Request("http://frontend.test/api/login-history"),
    );
    expect(response.status).toBe(status);
    expect(mocks.clear).toHaveBeenCalledTimes(status === 401 ? 1 : 0);
  });
  it("sanitizes connection failures", async () => {
    mocks.request.mockRejectedValue(new Error("internal connection detail"));
    const response = await GET(
      new Request("http://frontend.test/api/login-history"),
    );
    expect(response.status).toBe(503);
    expect(await response.text()).not.toContain("internal connection detail");
  });
});
