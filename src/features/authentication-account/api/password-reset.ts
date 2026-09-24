import { apiRequest } from "@/lib/api/api-client";
import type {
  ConfirmPasswordResetInput,
  RequestPasswordResetInput,
} from "../schemas/password-reset-schema";

export function requestPasswordReset(input: RequestPasswordResetInput): Promise<unknown> {
  return apiRequest("/api/auth/password-reset/request", {
    method: "POST",
    target: "same-origin",
    body: input,
  });
}

export function confirmPasswordReset(
  input: ConfirmPasswordResetInput,
): Promise<unknown> {
  const payload = {
    token: input.token,
    newPassword: input.newPassword,
    confirmPassword: input.confirmPassword,
  };
  return apiRequest("/api/auth/password-reset/confirm", {
    method: "POST",
    target: "same-origin",
    body: payload,
  });
}