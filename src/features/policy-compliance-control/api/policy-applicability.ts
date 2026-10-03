import { apiRequest } from "@/lib/api/api-client";
import {
  policyApplicabilitySchema,
  type DefinePolicyApplicability,
  type PolicyApplicability,
} from "../schemas/policy-applicability-schema";

const path = (policyId: string, versionId: string) =>
  `/api/compliance/policies/${encodeURIComponent(policyId)}/versions/${encodeURIComponent(versionId)}/applicability`;

export async function getPolicyApplicability(
  policyId: string,
  versionId: string,
  signal?: AbortSignal,
): Promise<PolicyApplicability> {
  const data = await apiRequest<unknown>(path(policyId, versionId), {
    target: "same-origin",
    ...(signal ? { signal } : {}),
  });
  return policyApplicabilitySchema.parse(data);
}

export async function definePolicyApplicability(
  policyId: string,
  versionId: string,
  body: DefinePolicyApplicability,
): Promise<PolicyApplicability> {
  const data = await apiRequest<unknown>(path(policyId, versionId), {
    method: "PUT",
    target: "same-origin",
    body,
  });
  return policyApplicabilitySchema.parse(data);
}
