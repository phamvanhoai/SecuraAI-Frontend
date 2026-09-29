import { apiRequest } from "@/lib/api/api-client";
import { ApiError } from "@/lib/api/api-error";
import type {
  ConfirmPasswordResetInput,
  RequestPasswordResetInput,
} from "../schemas/password-reset-schema";

type PasswordResetResult = { message: string };

function parsePasswordResetResult(value: unknown): PasswordResetResult {
  if (
    typeof value !== "object" ||
    value === null ||
    !("message" in value) ||
    typeof value.message !== "string"
  ) {
    throw new ApiError(
      "The server response does not match the expected contract.",
      502,
      "UNKNOWN_ERROR",
      value,
    );
  }
  return { message: value.message };
}

export async function requestPasswordReset(
  input: RequestPasswordResetInput,
): Promise<PasswordResetResult> {
  const data = await apiRequest<unknown>("/api/auth/password-reset/request", {
    method: "POST",
    target: "same-origin",
    body: input,
  });
  return parsePasswordResetResult(data);
}

export async function confirmPasswordReset(
  input: ConfirmPasswordResetInput,
): Promise<PasswordResetResult> {
  const data = await apiRequest<unknown>("/api/auth/password-reset/confirm", {
    method: "POST",
    target: "same-origin",
    body: input,
  });
  return parsePasswordResetResult(data);
}
