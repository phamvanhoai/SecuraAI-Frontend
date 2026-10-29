import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ fetch: vi.fn(), setAuthCookies: vi.fn() }));
vi.mock("@/lib/env", () => ({
  env: { NEXT_PUBLIC_API_BASE_URL: "http://backend.test/api/v1" },
}));
vi.mock("@/lib/auth/auth-cookies", () => ({
  setAuthCookies: mocks.setAuthCookies,
}));

import { POST } from "./route";

describe("POST /api/auth/login", () => {
  afterEach(() => vi.unstubAllGlobals());
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal("fetch", mocks.fetch);
  });

  function request(): Request {
    return new Request("http://frontend.test/api/auth/login", {
      method: "POST",
      body: JSON.stringify({
        email: "user@example.test",
        password: "CorrectPassword!",
      }),
    });
  }

  it("exposes only the approved locked-account message without setting cookies", async () => {
    mocks.fetch.mockResolvedValue(
      Response.json(
        {
          success: false,
          error: {
            code: "ACCOUNT_LOCKED",
            message: "untrusted provider message",
            stack: "private",
          },
        },
        { status: 401 },
      ),
    );

    const response = await POST(request());

    expect(response.status).toBe(401);
    expect(await response.json()).toEqual({
      success: false,
      error: { code: "ACCOUNT_LOCKED", message: "Account is LOCKED" },
    });
    expect(mocks.setAuthCookies).not.toHaveBeenCalled();
  });

  it("returns the approved unknown-account message without setting cookies", async () => {
    mocks.fetch.mockResolvedValue(
      Response.json(
        {
          success: false,
          error: {
            code: "ACCOUNT_NOT_FOUND",
            message: "private backend detail",
          },
        },
        { status: 401 },
      ),
    );
    const response = await POST(request());
    expect(response.status).toBe(401);
    expect(await response.json()).toEqual({
      success: false,
      error: { code: "ACCOUNT_NOT_FOUND", message: "Account does not exist" },
    });
    expect(mocks.setAuthCookies).not.toHaveBeenCalled();
  });

  it("returns the approved inactive-account message without setting cookies", async () => {
    mocks.fetch.mockResolvedValue(
      Response.json(
        {
          success: false,
          error: {
            code: "ACCOUNT_INACTIVE",
            message: "private backend detail",
          },
        },
        { status: 401 },
      ),
    );
    const response = await POST(request());
    expect(response.status).toBe(401);
    expect(await response.json()).toEqual({
      success: false,
      error: { code: "ACCOUNT_INACTIVE", message: "Account is INACTIVE" },
    });
    expect(mocks.setAuthCookies).not.toHaveBeenCalled();
  });

  it("keeps invalid credentials generic", async () => {
    mocks.fetch.mockResolvedValue(
      Response.json(
        {
          success: false,
          error: {
            code: "INVALID_CREDENTIALS",
            message: "private backend detail",
          },
        },
        { status: 401 },
      ),
    );

    const response = await POST(request());
    const payload = await response.json();

    expect(response.status).toBe(401);
    expect(payload.error.code).toBe("INVALID_CREDENTIALS");
    expect(payload.error.message).not.toContain("private");
    expect(mocks.setAuthCookies).not.toHaveBeenCalled();
  });

  it("falls back to a generic error for malformed backend JSON", async () => {
    mocks.fetch.mockResolvedValue(new Response("not-json", { status: 401 }));
    const response = await POST(request());
    expect(response.status).toBe(401);
    expect((await response.json()).error.code).toBe("INVALID_CREDENTIALS");
  });

  it("sets cookies for a successful login", async () => {
    const tokens = {
      accessToken: "access",
      refreshToken: "r".repeat(64),
      expiresIn: "900s",
    };
    mocks.fetch.mockResolvedValue(
      Response.json({ success: true, data: tokens }),
    );

    const response = await POST(request());

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      success: true,
      data: { authenticated: true },
    });
    expect(mocks.setAuthCookies).toHaveBeenCalledWith(response, tokens);
  });
});
