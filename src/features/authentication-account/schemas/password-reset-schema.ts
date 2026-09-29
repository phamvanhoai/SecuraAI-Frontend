import { z } from "zod";

export const requestPasswordResetSchema = z
  .object({
    email: z
      .string()
      .trim()
      .toLowerCase()
      .pipe(
        z
          .email("Enter a valid email address.")
          .max(255, "Email must not exceed 255 characters."),
      ),
  })
  .strict();

export const confirmPasswordResetSchema = z
  .object({
    token: z.string().regex(/^\d{6}$/, "Enter the 6-digit verification code."),
    newPassword: z
      .string()
      .min(1, "Enter a new password.")
      .min(8, "Password must be at least 8 characters.")
      .max(128, "Password must not exceed 128 characters.")
      .regex(/[A-Z]/, "Password must contain at least one uppercase letter.")
      .regex(
        /[^A-Za-z0-9]/,
        "Password must contain at least one special character.",
      ),
    confirmPassword: z.string().min(1, "Confirm your new password."),
  })
  .strict()
  .refine((value) => value.newPassword === value.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords do not match.",
  });

export type RequestPasswordResetInput = z.infer<
  typeof requestPasswordResetSchema
>;
export type ConfirmPasswordResetInput = z.infer<
  typeof confirmPasswordResetSchema
>;
