import { apiRequest } from "@/lib/api/api-client";
import { ApiError } from "@/lib/api/api-error";
import {
  createdUserSchema,
  type CreateUserPayload,
  type CreatedUser,
  type UserListQuery,
  type UserListResponse,
  type UserDetail,
  userDetailSchema,
  type UserCreateOptions,
  userCreateOptionsSchema,
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
        .map(
          (issue) => `${issue.path.join(".") || "response"}: ${issue.message}`,
        )
        .join("; ")}`,
      502,
      "UNKNOWN_ERROR",
      parsed.error.flatten(),
    );
  }
  return parsed.data;
}

export async function createUser(
  input: CreateUserPayload,
): Promise<CreatedUser> {
  const body = {
    email: input.email,
    fullName: input.fullName,
    employeeCode: input.employeeCode,
    departmentId: input.departmentId,
    roleCodes: input.roleCodes,
  };
  const data = await apiRequest<unknown>("/api/users", {
    method: "POST",
    target: "same-origin",
    body,
  });
  return createdUserSchema.parse(data);
}

export async function getUser(
  userId: string,
  signal?: AbortSignal,
): Promise<UserDetail> {
  const data = await apiRequest<unknown>(
    `/api/users/${encodeURIComponent(userId)}`,
    {
      method: "GET",
      target: "same-origin",
      ...(signal ? { signal } : {}),
    },
  );
  const parsed = userDetailSchema.safeParse(data);
  if (!parsed.success) {
    throw new ApiError(
      "The server returned invalid user details.",
      502,
      "UNKNOWN_ERROR",
      parsed.error.flatten(),
    );
  }
  return parsed.data;
}

export async function getUserCreateOptions(
  signal?: AbortSignal,
): Promise<UserCreateOptions> {
  const data = await apiRequest<unknown>("/api/users/create-options", {
    method: "GET",
    target: "same-origin",
    ...(signal ? { signal } : {}),
  });
  const parsed = userCreateOptionsSchema.safeParse(data);
  if (!parsed.success) {
    throw new ApiError(
      "The server returned invalid user creation options.",
      502,
      "UNKNOWN_ERROR",
      parsed.error.flatten(),
    );
  }
  return {
    ...parsed.data,
    roles: parsed.data.roles.filter((role) => role.code !== "ALL"),
  };
}
