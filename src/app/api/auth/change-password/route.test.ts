import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  cookieGet: vi.fn(),
  clearAuthCookies: vi.fn(),
  setAuthCookies: vi.fn(),
  requestTokenPair: vi.fn(),
}));

vi.mock("next/headers", () => ({
  cookies: vi.fn(async () => ({ get: mocks.cookieGet })),
}));
vi.mock("@/lib/auth/auth-cookies", () => ({
  authCookieNames: { access: "securaai_access", refresh: "securaai_refresh" },
  clearAuthCookies: mocks.clearAuthCookies,
  setAuthCookies: mocks.setAuthCookies,
}));
vi.mock("@/lib/auth/backend-auth", () => ({
  requestTokenPair: mocks.requestTokenPair,
}));
vi.mock("@/lib/env", () => ({
  env: { NEXT_PUBLIC_API_BASE_URL: "http://backend.test/api/v1" },
}));

import { POST } from "./route";

const requestBody = {
  currentPassword: "OldPassword1!",
  newPassword: "NewPassword2@",
  confirmPassword: "NewPassword2@",
};

function request(): Request {
  return new Request("http://frontend.test/api/auth/change-password", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(requestBody),
  });
}

describe("POST /api/auth/change-password", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.restoreAllMocks();
  });

  it("forwards the access token and preserves the current browser session after success", async () => {
    mocks.cookieGet.mockImplementation((name: string) =>
      name === "securaai_access" ? { value: "access-token" } : undefined,
    );
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(
        new Response(
          JSON.stringify({ success: true, data: { message: "Changed" } }),
          { status: 200, headers: { "Content-Type": "application/json" } },
        ),
      );

    const response = await POST(request());

    expect(response.status).toBe(200);
    expect(fetchMock).toHaveBeenCalledWith(
      "http://backend.test/api/v1/auth/change-password",
      expect.objectContaining({
        body: JSON.stringify(requestBody),
        headers: expect.objectContaining({
          Authorization: "Bearer access-token",
        }),
      }),
    );
    expect(mocks.clearAuthCookies).not.toHaveBeenCalled();
  });

  it("refreshes an expired access token once before retrying", async () => {
    mocks.cookieGet.mockImplementation((name: string) =>
      name === "securaai_access"
        ? { value: "expired-token" }
        : { value: "refresh-token" },
    );
    mocks.requestTokenPair.mockResolvedValue({
      response: new Response(null, { status: 200 }),
      tokens: {
        accessToken: "fresh-token",
        refreshToken: "fresh-refresh-token",
        expiresIn: "15m",
      },
    });
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(new Response(null, { status: 401 }))
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({ success: true, data: { message: "Changed" } }),
          {
            status: 200,
          },
        ),
      );

    const response = await POST(request());

    expect(response.status).toBe(200);
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(fetchMock.mock.calls[1]?.[1]?.headers).toEqual(
      expect.objectContaining({ Authorization: "Bearer fresh-token" }),
    );
    expect(mocks.clearAuthCookies).not.toHaveBeenCalled();
    expect(mocks.setAuthCookies).toHaveBeenCalledWith(response, {
      accessToken: "fresh-token",
      refreshToken: "fresh-refresh-token",
      expiresIn: "15m",
    });
  });

  it("returns 401 and clears stale cookies when no session is available", async () => {
    mocks.cookieGet.mockReturnValue(undefined);

    const response = await POST(request());

    expect(response.status).toBe(401);
    expect(mocks.clearAuthCookies).toHaveBeenCalledWith(response);
  });
});
