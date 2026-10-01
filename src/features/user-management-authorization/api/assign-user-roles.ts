import { z } from "zod";
import { apiRequest } from "@/lib/api/api-client";

const roleCodeSchema = z.enum(["ADMIN", "SECURITY_OFFICER", "EMPLOYEE", "EXECUTIVE"]);
const targetTypeSchema = z.enum(["GLOBAL", "BUSINESS_SERVICE", "ASSET"]);
const ownershipSummarySchema = z.object({
  businessServices: z.number().int().nonnegative(), assets: z.number().int().nonnegative(),
  risks: z.number().int().nonnegative(), treatmentPlans: z.number().int().nonnegative(),
  treatmentActions: z.number().int().nonnegative(), securityControls: z.number().int().nonnegative(),
  evidenceItems: z.number().int().nonnegative(), policies: z.number().int().nonnegative(),
});

export const accessAssignmentOptionsSchema = z.object({
  roles: z.array(z.object({ code: roleCodeSchema, name: z.string() })),
  scopeCodes: z.array(z.object({ code: z.string(), name: z.string() })),
  targetTypes: z.array(targetTypeSchema),
  businessServices: z.array(z.object({ id: z.uuid(), name: z.string(), ownerUserId: z.uuid().nullable() })),
  assets: z.array(z.object({ id: z.uuid(), code: z.string(), name: z.string(), ownerUserId: z.uuid().nullable() })),
});

export const accessAssignmentSchema = z.object({
  user: z.object({ id: z.uuid(), fullName: z.string(), email: z.email(), status: z.string() }),
  role: roleCodeSchema,
  scopes: z.array(z.object({
    id: z.uuid(), scopeCode: z.string(), targetType: targetTypeSchema,
    targetId: z.uuid().nullable(), assignedAt: z.iso.datetime(), expiresAt: z.iso.datetime().nullable(),
  })),
  ownershipSummary: ownershipSummarySchema,
});

export type AccessAssignmentOptions = z.infer<typeof accessAssignmentOptionsSchema>;
export type AccessAssignment = z.infer<typeof accessAssignmentSchema>;
export type AccessScopeInput = {
  scopeCode: string;
  targetType: z.infer<typeof targetTypeSchema>;
  targetId?: string | undefined;
  expiresAt?: string | null | undefined;
};
export type AccessAssignmentPayload = { role: z.infer<typeof roleCodeSchema>; scopes: AccessScopeInput[] };

export async function getAccessAssignmentOptions(signal?: AbortSignal): Promise<AccessAssignmentOptions> {
  const data = await apiRequest<unknown>("/api/users/access-assignment-options", { method: "GET", target: "same-origin", ...(signal ? { signal } : {}) });
  return accessAssignmentOptionsSchema.parse(data);
}
export async function getUserAccessAssignment(userId: string, signal?: AbortSignal): Promise<AccessAssignment> {
  const data = await apiRequest<unknown>(`/api/users/${encodeURIComponent(userId)}/access-assignment`, { method: "GET", target: "same-origin", ...(signal ? { signal } : {}) });
  return accessAssignmentSchema.parse(data);
}
export async function assignUserAccess(userId: string, payload: AccessAssignmentPayload): Promise<{ changed: boolean; role: string; scopeCount: number }> {
  return apiRequest(`/api/users/${encodeURIComponent(userId)}/access-assignment`, { method: "PUT", target: "same-origin", body: payload });
}
