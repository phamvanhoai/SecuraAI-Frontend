"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  assignPolicyDepartments,
  listPolicyDepartmentAssignments,
} from "../api/policy-department-assignments";
import type { PolicyDepartmentAssignmentQuery } from "../schemas/policy-department-assignment-schema";

const keys = ["policies", "department-assignments"] as const;

export function usePolicyDepartmentAssignments(
  query: PolicyDepartmentAssignmentQuery,
  enabled: boolean,
) {
  return useQuery({
    queryKey: [...keys, query],
    queryFn: ({ signal }) => listPolicyDepartmentAssignments(query, signal),
    enabled,
  });
}

export function useAssignPolicyDepartments() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: assignPolicyDepartments,
    retry: false,
    onSuccess: () => client.invalidateQueries({ queryKey: keys }),
  });
}
