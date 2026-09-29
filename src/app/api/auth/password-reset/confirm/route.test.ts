import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ clearAuthCookies: vi.fn() }));

vi.mock("@/lib/auth/auth-cookies", () => ({
  clearAuthCookies: mocks.clearAuthCookies,
}));
vi.mock("@/lib/env", () => ({
  env: { NEXT_PUBLIC_API_BASE_URL: "http://backend.test/api/v1" },
}));

import { POST } from "./route";

const body = {
  token: "123456",
  newPassword: "NewPassword2@",
  confirmPassword: "NewPassword2@",
};

function request(): Request {
  return new Request("http://frontend.test/api/auth/password-reset/confirm", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("POST /api/auth/password-reset/confirm", () => {
  beforeEach(() => vi.clearAllMocks());
  afterEach(() => vi.restoreAllMocks());

  it("clears browser auth cookies after the backend revokes all sessions", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      Response.json({
        success: true,
        data: { message: "Password reset successfully." },
      }),
    );

    const response = await POST(request());

    expect(response.status).toBe(200);
    expect(mocks.clearAuthCookies).toHaveBeenCalledWith(response);
  });

  it("preserves cookies when the reset code is rejected", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      Response.json(
        {
          success: false,
          error: {
            code: "INVALID_PASSWORD_RESET_TOKEN",
            message: "Password reset token is invalid or expired",
          },
        },
        { status: 400 },
      ),
    );

    const response = await POST(request());

    expect(response.status).toBe(400);
    expect(mocks.clearAuthCookies).not.toHaveBeenCalled();
  });
});
