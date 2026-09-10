import { apiRequest } from "@/lib/api/api-client";
import { ApiError } from "@/lib/api/api-error";
import {
  createdUserSchema,
  type CreateUserPayload,
  type CreatedUser,
  type UserListQuery,
  type UserListResponse,
  userListResponseSchema,
} from "../schemas/user-schema";

export async function listUsers(
  query: UserListQuery,
  signal?: AbortSignal,
): Promise<UserListResponse> {
  const data = await apiRequest<unknown>("/api/users", {
    method: "GET",
    target: "same-origin",
    query,
    ...(signal ? { signal } : {}),
  });
  const parsed = userListResponseSchema.safeParse(data);
  if (!parsed.success) {
    throw new ApiError(
      `The server returned an invalid user list: ${parsed.error.issues
        .map((issue) => `${issue.path.join(".") || "response"}: ${issue.message}`)
        .join("; ")}`,
      502,
      "UNKNOWN_ERROR",
      parsed.error.flatten(),
    );
  }
  return parsed.data;
}

export async function createUser(input: CreateUserPayload): Promise<CreatedUser> {
  const data = await apiRequest<unknown>("/api/users", {
    method: "POST",
    target: "same-origin",
    body: input,
  });
  return createdUserSchema.parse(data);
}