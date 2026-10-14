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
  type UpdateUserPayload,
  type UserImportResult,
  userImportResultSchema,
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
    role: input.role,
    ...(input.phone ? { phone: input.phone } : {}),
    ...(input.employeeCode ? { employeeCode: input.employeeCode } : {}),
    ...(input.departmentId ? { departmentId: input.departmentId } : {}),
  };
  const data = await apiRequest<unknown>("/api/users", {
    method: "POST",
    target: "same-origin",
    body,
  });
  return createdUserSchema.parse(data);
}

export async function updateUser(
  userId: string,
  input: UpdateUserPayload,
): Promise<UserDetail> {
  const body = {
    fullName: input.fullName,
    phone: input.phone || null,
    employeeCode: input.employeeCode || null,
    departmentId: input.departmentId || null,
    status: input.status.toUpperCase(),
  };
  const data = await apiRequest<unknown>(
    `/api/users/${encodeURIComponent(userId)}`,
    { method: "PATCH", target: "same-origin", body },
  );
  return userDetailSchema.parse(data);
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
  return parsed.data;
}

export async function importUsers(file: File): Promise<UserImportResult> {
  const form = new FormData();
  form.set("file", file);
  const response = await fetch("/api/users/import", {
    method: "POST",
    credentials: "include",
    body: form,
  });
  const payload: unknown = await response.json().catch(() => undefined);
  if (!response.ok) {
    const message =
      typeof payload === "object" && payload !== null && "error" in payload
        ? String(
            (payload as { error?: { message?: unknown } }).error?.message ??
              "Import failed",
          )
        : "Import failed";
    throw new ApiError(message, response.status, "UNKNOWN_ERROR", payload);
  }
  const data =
    typeof payload === "object" && payload !== null && "data" in payload
      ? (payload as { data: unknown }).data
      : undefined;
  return userImportResultSchema.parse(data);
}

export async function getUserDepartments(
  signal?: AbortSignal,
): Promise<UserCreateOptions> {
  const data = await apiRequest<unknown>("/api/users/departments", {
    method: "GET",
    target: "same-origin",
    ...(signal ? { signal } : {}),
  });
  const parsed = userCreateOptionsSchema.safeParse(data);
  if (!parsed.success) {
    throw new ApiError(
      "The server returned invalid department filter options.",
      502,
      "UNKNOWN_ERROR",
      parsed.error.flatten(),
    );
  }
  return parsed.data;
}
