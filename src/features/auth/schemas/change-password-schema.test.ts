import { describe, expect, it } from "vitest";
import { changePasswordSchema } from "./change-password-schema";

const validInput = {
  currentPassword: "OldPassword1!",
  newPassword: "NewPassword2@",
  confirmPassword: "NewPassword2@",
};

describe("changePasswordSchema", () => {
  it("accepts the backend change-password contract", () => {
    expect(changePasswordSchema.parse(validInput)).toEqual(validInput);
  });

  it.each([
    ["too short", "Short!A"],
    ["without an uppercase letter", "newpassword!"],
    ["without a special character", "NewPassword2"],
  ])("rejects a password that is %s", (_case, newPassword) => {
    expect(
      changePasswordSchema.safeParse({
        ...validInput,
        newPassword,
        confirmPassword: newPassword,
      }).success,
    ).toBe(false);
  });

  it("rejects a mismatched confirmation", () => {
    const result = changePasswordSchema.safeParse({
      ...validInput,
      confirmPassword: "DifferentPassword3#",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(
        result.error.issues.some(
          (issue) => issue.path[0] === "confirmPassword",
        ),
      ).toBe(true);
    }
  });
});
