import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/env", () => ({
  env: { NEXT_PUBLIC_API_BASE_URL: "http://backend.test/api/v1" },
}));

import { POST } from "./route";

afterEach(() => vi.restoreAllMocks());

function request(): Request {
  return new Request("http://frontend.test/api/auth/password-reset/verify", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token: "123456" }),
  });
}

describe("POST /api/auth/password-reset/verify", () => {
  it("forwards the reset code without consuming it", async () => {
    const payload = {
      success: true,
      data: { message: "Password reset code is valid." },
    };
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(Response.json(payload));

    const response = await POST(request());

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual(payload);
    expect(fetchMock).toHaveBeenCalledWith(
      "http://backend.test/api/v1/auth/password-reset/verify",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ token: "123456" }),
        cache: "no-store",
      }),
    );
  });

  it("preserves an invalid-code response", async () => {
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
  });
});
