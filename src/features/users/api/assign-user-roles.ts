import { z } from "zod";
import { apiRequest } from "@/lib/api/api-client";

export const assignableRoleSchema = z.object({
  code: z.string(), name: z.string(), description: z.string().nullable(), isSystem: z.boolean(),
});
export type AssignableRole = z.infer<typeof assignableRoleSchema>;

export async function listAssignableRoles(signal?: AbortSignal): Promise<AssignableRole[]> {
  const data = await apiRequest<unknown>("/api/users/assignable-roles", {
    method: "GET", target: "same-origin", ...(signal ? { signal } : {}),
  });
  return z.array(assignableRoleSchema).parse(data).filter((role) => role.code !== "ALL");
}

export async function assignUserRoles(userId: string, roleCodes: string[]): Promise<{ assignedRoleCodes: string[]; changed: boolean }> {
  const data = await apiRequest<unknown>(`/api/users/${encodeURIComponent(userId)}/roles`, {
    method: "POST", target: "same-origin", body: { roleCodes },
  });
  return z.object({ assignedRoleCodes: z.array(z.string()), changed: z.boolean() }).parse(data);
}
