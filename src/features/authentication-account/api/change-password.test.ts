import { afterEach, describe, expect, it, vi } from "vitest";
import { changePassword } from "./change-password";

afterEach(() => vi.restoreAllMocks());

describe("changePassword", () => {
  it("sends the backend contract through the same-origin BFF", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({
          success: true,
          data: {
            message: "Password changed successfully. Please log in again.",
          },
        }),
        { status: 200 },
      ),
    );
    const input = {
      currentPassword: "OldPassword1!",
      newPassword: "NewPassword2@",
      confirmPassword: "NewPassword2@",
    };

    await expect(changePassword(input)).resolves.toEqual({
      message: "Password changed successfully. Please log in again.",
    });
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/auth/change-password",
      expect.objectContaining({
        method: "POST",
        credentials: "include",
        body: JSON.stringify(input),
      }),
    );
  });
});
