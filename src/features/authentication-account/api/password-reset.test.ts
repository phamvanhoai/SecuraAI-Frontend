import { afterEach, describe, expect, it, vi } from "vitest";
import { ApiError } from "@/lib/api/api-error";
import { confirmPasswordReset, requestPasswordReset } from "./password-reset";

afterEach(() => vi.restoreAllMocks());

describe("password reset API", () => {
  it("requests a reset through the same-origin BFF", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      Response.json({
        success: true,
        data: {
          message:
            "If the account exists, password reset instructions will be sent.",
        },
      }),
    );

    await expect(
      requestPasswordReset({ email: "user@example.com" }),
    ).resolves.toEqual({
      message:
        "If the account exists, password reset instructions will be sent.",
    });
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/auth/password-reset/request",
      expect.objectContaining({
        method: "POST",
        credentials: "include",
        body: JSON.stringify({ email: "user@example.com" }),
      }),
    );
  });

  it("confirms the exact V2 reset contract", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      Response.json({
        success: true,
        data: { message: "Password reset successfully." },
      }),
    );
    const input = {
      token: "123456",
      newPassword: "NewPassword2@",
      confirmPassword: "NewPassword2@",
    };

    await expect(confirmPasswordReset(input)).resolves.toEqual({
      message: "Password reset successfully.",
    });
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/auth/password-reset/confirm",
      expect.objectContaining({ body: JSON.stringify(input) }),
    );
  });

  it("rejects a success payload outside the response contract", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      Response.json({ success: true, data: {} }),
    );

    await expect(
      requestPasswordReset({ email: "user@example.com" }),
    ).rejects.toBeInstanceOf(ApiError);
  });
});
