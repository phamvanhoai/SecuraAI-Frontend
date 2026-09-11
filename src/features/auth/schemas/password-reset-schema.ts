import { z } from "zod";

export const requestPasswordResetSchema = z.object({
  email: z.email("Enter a valid email address."),
});

export const confirmPasswordResetSchema = z
  .object({
    token: z.string().regex(/^\d{6}$/, "Enter the 6-digit verification code."),
    newPassword: z.string().min(8, "Password must be at least 8 characters."),
    confirmPassword: z.string(),
  })
  .refine((value) => value.newPassword === value.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords do not match.",
  });

export type RequestPasswordResetInput = z.infer<typeof requestPasswordResetSchema>;
export type ConfirmPasswordResetInput = z.infer<typeof confirmPasswordResetSchema>;