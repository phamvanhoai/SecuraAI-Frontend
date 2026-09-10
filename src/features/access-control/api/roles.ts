import { ApiError, normalizeApiError } from "@/lib/api/api-error";
import {
  permissionListSchema,
  roleListSchema,
  roleSchema,
  type Role,
  type PermissionList,
  type RoleFormValues,
  type RoleList,
} from "../schemas/role-schema";

export function listPermissions(signal?: AbortSignal): Promise<PermissionList> {
  return roleRequest(
    "/api/access-control/permissions?page=1&limit=200&sortBy=code&sortOrder=asc",
    permissionListSchema,
    signal ? { signal } : undefined,
  );
}

export type ListRolesInput = {
  page: number;
  limit: number;
  search?: string;
  signal?: AbortSignal;
};

async function safeJson(response: Response): Promise<unknown> {
  const text = await response.text();
  if (!text) return undefined;
  try {
    return JSON.parse(text) as unknown;
  } catch {
    throw new ApiError(
      "The server returned an invalid response.",
      response.status,
      "UNKNOWN_ERROR",
    );
  }
}

async function fetchWithSessionRefresh(
  input: RequestInfo | URL,
  init?: RequestInit,
): Promise<Response> {
  let response = await fetch(input, init);
  if (response.status !== 401) return response;
  const refreshed = await fetch("/api/auth/refresh", { method: "POST" });
  if (!refreshed.ok) return response;
  response = await fetch(input, init);
  return response;
}

async function roleRequest<T>(
  path: string,
  schema: { parse(value: unknown): T },
  init?: RequestInit,
): Promise<T> {
  const response = await fetchWithSessionRefresh(path, init);
  const payload = await safeJson(response);
  if (!response.ok) throw normalizeApiError(response.status, payload);
  if (
    typeof payload !== "object" ||
    payload === null ||
    !("success" in payload) ||
    !("data" in payload)
  ) {
    throw new ApiError(
      "The server response does not match the expected contract.",
      response.status,
      "UNKNOWN_ERROR",
      payload,
    );
  }
  return schema.parse((payload as { data: unknown }).data);
}

export function listRoles(input: ListRolesInput): Promise<RoleList> {
  const query = new URLSearchParams({
    page: String(input.page),
    limit: String(input.limit),
    sortBy: "name",
    sortOrder: "asc",
  });
  if (input.search) query.set("search", input.search);
  return roleRequest(
    `/api/access-control/roles?${query.toString()}`,
    roleListSchema,
    input.signal ? { signal: input.signal } : undefined,
  );
}

export function createRole(input: RoleFormValues): Promise<Role> {
  return roleRequest("/api/access-control/roles", roleSchema, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      ...input,
      description: input.description || null,
    }),
  });
}

export function updateRole(id: string, input: RoleFormValues): Promise<Role> {
  return roleRequest(
    `/api/access-control/roles/${encodeURIComponent(id)}`,
    roleSchema,
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...input,
        description: input.description || null,
      }),
    },
  );
}

export async function deleteRole(id: string): Promise<void> {
  const path = `/api/access-control/roles/${encodeURIComponent(id)}`;
  const response = await fetchWithSessionRefresh(path, { method: "DELETE" });
  if (response.ok) return;
  throw normalizeApiError(response.status, await safeJson(response));
}
