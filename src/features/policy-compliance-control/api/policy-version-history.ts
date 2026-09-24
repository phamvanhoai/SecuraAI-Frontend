import { apiRequest } from "@/lib/api/api-client";
import {
  policyVersionHistoryDetailSchema,
  policyVersionHistoryListSchema,
  type PolicyVersionHistoryQuery,
} from "../schemas/policy-version-history-schema";

export async function listPolicyVersionHistory(
  query: PolicyVersionHistoryQuery,
  signal?: AbortSignal,
) {
  return policyVersionHistoryListSchema.parse(
    await apiRequest<unknown>("/api/compliance/policies/version-history", {
      target: "same-origin",
      query,
      ...(signal ? { signal } : {}),
    }),
  );
}

export async function getPolicyVersionHistoryDetail(
  policyId: string,
  versionId: string,
  signal?: AbortSignal,
) {
  return policyVersionHistoryDetailSchema.parse(
    await apiRequest<unknown>(
      `/api/compliance/policies/${encodeURIComponent(policyId)}/versions/${encodeURIComponent(versionId)}/history`,
      { target: "same-origin", ...(signal ? { signal } : {}) },
    ),
  );
}
