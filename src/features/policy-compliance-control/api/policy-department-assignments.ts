import { apiRequest } from "@/lib/api/api-client";
import {
  assignedPolicyDepartmentsSchema,
  policyDepartmentAssignmentsSchema,
  type AssignedPolicyDepartments,
  type AssignPolicyDepartmentsRequest,
  type PolicyDepartmentAssignmentQuery,
  type PolicyDepartmentAssignments,
} from "../schemas/policy-department-assignment-schema";

export async function listPolicyDepartmentAssignments(
  query: PolicyDepartmentAssignmentQuery,
  signal?: AbortSignal,
): Promise<PolicyDepartmentAssignments> {
  const data = await apiRequest<unknown>(
    "/api/compliance/policies/department-assignments",
    { target: "same-origin", query, ...(signal ? { signal } : {}) },
  );
  return policyDepartmentAssignmentsSchema.parse(data);
}

export async function assignPolicyDepartments(input: {
  policyId: string;
  body: AssignPolicyDepartmentsRequest;
}): Promise<AssignedPolicyDepartments> {
  const data = await apiRequest<unknown>(
    `/api/compliance/policies/${encodeURIComponent(input.policyId)}/departments`,
    { target: "same-origin", method: "PUT", body: input.body },
  );
  return assignedPolicyDepartmentsSchema.parse(data);
}
