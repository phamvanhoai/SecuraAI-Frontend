import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  cookieGet: vi.fn(),
  refresh: vi.fn(),
  setCookies: vi.fn(),
  clearCookies: vi.fn(),
}));
vi.mock("server-only", () => ({}));
vi.mock("next/headers", () => ({
  cookies: async () => ({ get: mocks.cookieGet }),
}));
vi.mock("@/lib/auth/auth-cookies", () => ({
  authCookieNames: { access: "access", refresh: "refresh" },
  setAuthCookies: mocks.setCookies,
  clearAuthCookies: mocks.clearCookies,
}));
vi.mock("@/lib/auth/backend-auth", () => ({ requestTokenPair: mocks.refresh }));
vi.mock("@/lib/env", () => ({
  env: { NEXT_PUBLIC_API_BASE_URL: "http://backend.test/api/v1" },
}));
import { POST } from "./route";

const userId = "00000000-0000-4000-8000-000000000002";
const input = { reason: "Security investigation" };
const result = {
  success: true,
  data: {
    id: userId,
    status: "disabled",
    disabledAt: "2026-09-17T08:00:00.000Z",
    deletedAt: null,
    updatedAt: "2026-09-17T08:00:00.000Z",
    changed: true,
  },
};
const context = (action = "deactivate", id = userId) => ({
  params: Promise.resolve({ userId: id, action }),
});
function request(body: unknown = input): Request {
  return new Request(`http://frontend.test/api/users/${userId}/deactivate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}
beforeEach(() => {
  vi.restoreAllMocks();
  vi.clearAllMocks();
  mocks.cookieGet.mockImplementation((name: string) =>
    name === "access" ? { value: "access-token" } : undefined,
  );
});

describe("account deactivation BFF", () => {
  it("forwards only normalized input with the server-side access token", async () => {
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(Response.json(result));
    const response = await POST(
      request({ reason: "  Security investigation  " }),
      context(),
    );
    expect(fetchMock).toHaveBeenCalledWith(
      `http://backend.test/api/v1/admin/users/${userId}/deactivate`,
      expect.objectContaining({
        method: "POST",
        cache: "no-store",
        body: JSON.stringify(input),
        headers: expect.objectContaining({
          Authorization: "Bearer access-token",
        }),
      }),
    );
    expect(await response.json()).toEqual(result);
  });

  it("rejects malformed parameters, unknown actions and invalid bodies before backend calls", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch");
    for (const params of [context("delete"), context("deactivate", "invalid")]) {
      expect((await POST(request(), params)).status).toBe(422);
    }
    for (const body of [
      {},
      { reason: "short" },
      { ...input, status: "disabled" },
    ]) {
      expect((await POST(request(body), context())).status).toBe(422);
    }
    expect(
      (
        await POST(
          new Request("http://frontend.test/api/users/x/deactivate", {
            method: "POST",
            body: "{",
          }),
          context(),
        )
      ).status,
    ).toBe(422);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("does not call the backend without a session and clears expired cookies", async () => {
    mocks.cookieGet.mockReturnValue(undefined);
    const fetchMock = vi.spyOn(globalThis, "fetch");
    const response = await POST(request(), context());
    expect(response.status).toBe(401);
    expect(fetchMock).not.toHaveBeenCalled();
    expect(mocks.clearCookies).toHaveBeenCalledWith(response);
  });

  it(
    "refreshes a missing access cookie before deactivation without exposing tokens",
    async () => {
      mocks.cookieGet.mockImplementation((name: string) =>
        name === "refresh" ? { value: "refresh-token" } : undefined,
      );
      const tokens = {
        accessToken: "fresh-access",
        refreshToken: "fresh-refresh",
        expiresIn: "15m",
      };
      mocks.refresh.mockResolvedValue({ tokens });
      const fetchMock = vi
        .spyOn(globalThis, "fetch")
        .mockResolvedValue(Response.json(result));
      const response = await POST(request(), context());
      expect(fetchMock).toHaveBeenCalledWith(
        `http://backend.test/api/v1/admin/users/${userId}/deactivate`,
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: "Bearer fresh-access",
          }),
        }),
      );
      expect(mocks.setCookies).toHaveBeenCalledWith(response, tokens);
      expect(await response.text()).not.toContain("fresh-access");
    },
  );

  it("refreshes an expired access token once and preserves the backend conflict", async () => {
    mocks.cookieGet.mockImplementation((name: string) => ({
      value: name === "access" ? "expired" : "refresh-token",
    }));
    mocks.refresh.mockResolvedValue({
      tokens: {
        accessToken: "fresh-access",
        refreshToken: "fresh-refresh",
        expiresIn: "15m",
      },
    });
    const error = {
      success: false,
      error: {
        code: "LAST_ACCOUNT_MANAGER",
        message: "Last administrator cannot be deactivated",
      },
    };
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(new Response(null, { status: 401 }))
      .mockResolvedValueOnce(Response.json(error, { status: 409 }));
    const response = await POST(request(), context());
    expect(response.status).toBe(409);
    expect(await response.json()).toEqual(error);
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(mocks.refresh).toHaveBeenCalledOnce();
  });

  it("returns a generic service error on connection failure", async () => {
    vi.spyOn(globalThis, "fetch").mockRejectedValue(
      new Error("Private backend details"),
    );
    const response = await POST(request(), context());
    expect(response.status).toBe(503);
    expect(await response.text()).not.toContain("Private");
  });
});
