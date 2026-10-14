import { apiRequest } from "@/lib/api/api-client";
import { ApiError } from "@/lib/api/api-error";
import {
  userActivityAuditResponseSchema,
  type AuditOutcome,
} from "../schemas/user-activity-audit-schema";
export type UserActivityAuditQuery = {
  page: number;
  limit: number;
  q?: string;
  outcome?: AuditOutcome;
  resourceType?: string;
};
export async function getUserActivityAudit(
  query: UserActivityAuditQuery,
  signal?: AbortSignal,
) {
  const data = await apiRequest<unknown>("/api/audit/user-activities", {
    target: "same-origin",
    query,
    ...(signal ? { signal } : {}),
  });
  const parsed = userActivityAuditResponseSchema.safeParse(data);
  if (!parsed.success)
    throw new ApiError(
      "The audit-log response could not be verified.",
      502,
      "UNKNOWN_ERROR",
    );
  return parsed.data;
}
