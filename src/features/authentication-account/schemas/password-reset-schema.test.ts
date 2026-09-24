import { describe, expect, it } from "vitest";
import { confirmPasswordResetSchema } from "./password-reset-schema";

const validInput = {
  token: "123456",
  newPassword: "Secure-password!",
  confirmPassword: "Secure-password!",
};

describe("confirmPasswordResetSchema", () => {
  it("accepts matching passwords with at least 8 characters", () => {
    expect(confirmPasswordResetSchema.safeParse(validInput).success).toBe(true);
  });

  it("explains when the new password is empty", () => {
    const result = confirmPasswordResetSchema.safeParse({
      ...validInput,
      newPassword: "",
      confirmPassword: "",
    });

    expect(result.error?.issues[0]?.message).toBe("Enter a new password.");
  });

  it("explains when the new password is too short", () => {
    const result = confirmPasswordResetSchema.safeParse({
      ...validInput,
      newPassword: "short",
      confirmPassword: "short",
    });

    expect(result.error?.issues[0]?.message).toBe(
      "Password must be at least 8 characters.",
    );
  });

  it("requires an uppercase letter", () => {
    const result = confirmPasswordResetSchema.safeParse({
      ...validInput,
      newPassword: "secure-password!",
      confirmPassword: "secure-password!",
    });

    expect(result.error?.issues[0]?.message).toBe(
      "Password must contain at least one uppercase letter.",
    );
  });

  it("requires a special character", () => {
    const result = confirmPasswordResetSchema.safeParse({
      ...validInput,
      newPassword: "SecurePassword1",
      confirmPassword: "SecurePassword1",
    });

    expect(result.error?.issues[0]?.message).toBe(
      "Password must contain at least one special character.",
    );
  });

  it("points a mismatch error at the confirmation field", () => {
    const result = confirmPasswordResetSchema.safeParse({
      ...validInput,
      confirmPassword: "different-password",
    });

    expect(result.error?.issues).toContainEqual(
      expect.objectContaining({
        path: ["confirmPassword"],
        message: "Passwords do not match.",
      }),
    );
  });
});
