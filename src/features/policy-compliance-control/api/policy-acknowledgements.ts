import { apiRequest } from "@/lib/api/api-client";
import {
  acknowledgementSchema,
  employeePolicyDetailSchema,
  employeePolicyListSchema,
  type EmployeePolicyQuery,
} from "../schemas/policy-acknowledgement-schema";
export async function listEmployeePolicies(
  query: EmployeePolicyQuery,
  signal?: AbortSignal,
) {
  return employeePolicyListSchema.parse(
    await apiRequest<unknown>(
      "/api/compliance/policies/acknowledgements/mine",
      { target: "same-origin", query, ...(signal ? { signal } : {}) },
    ),
  );
}
export async function getEmployeePolicy(
  policyId: string,
  versionId: string,
  signal?: AbortSignal,
) {
  return employeePolicyDetailSchema.parse(
    await apiRequest<unknown>(
      `/api/compliance/policies/${encodeURIComponent(policyId)}/versions/${encodeURIComponent(versionId)}/acknowledgement`,
      { target: "same-origin", ...(signal ? { signal } : {}) },
    ),
  );
}
export async function acknowledgePolicy(policyId: string, versionId: string) {
  return acknowledgementSchema.parse(
    await apiRequest<unknown>(
      `/api/compliance/policies/${encodeURIComponent(policyId)}/versions/${encodeURIComponent(versionId)}/acknowledgements`,
      { target: "same-origin", method: "POST", body: {} },
    ),
  );
}
