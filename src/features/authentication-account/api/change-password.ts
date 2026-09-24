import { ApiError } from "@/lib/api/api-error";
import { apiRequest } from "@/lib/api/api-client";
import type { ChangePasswordInput } from "../schemas/change-password-schema";

const changePasswordResultSchema = {
  parse(value: unknown): { message: string } {
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
  },
};

export async function changePassword(
  input: ChangePasswordInput,
): Promise<{ message: string }> {
  const data = await apiRequest<unknown>("/api/auth/change-password", {
    method: "POST",
    target: "same-origin",
    body: input,
  });
  return changePasswordResultSchema.parse(data);
}
