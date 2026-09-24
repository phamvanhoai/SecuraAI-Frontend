"use client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  acknowledgePolicy,
  getEmployeePolicy,
  listEmployeePolicies,
} from "../api/policy-acknowledgements";
import type { EmployeePolicyQuery } from "../schemas/policy-acknowledgement-schema";
const keys = ["policies", "acknowledgements"] as const;
export const useEmployeePolicies = (
  query: EmployeePolicyQuery,
  enabled: boolean,
) =>
  useQuery({
    queryKey: [...keys, query],
    queryFn: ({ signal }) => listEmployeePolicies(query, signal),
    enabled,
    retry: false,
  });
export const useEmployeePolicy = (p: string | null, v: string | null) =>
  useQuery({
    queryKey: [...keys, "detail", p, v],
    queryFn: ({ signal }) => getEmployeePolicy(p ?? "", v ?? "", signal),
    enabled: p !== null && v !== null,
    retry: false,
  });
export function useAcknowledgePolicy() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({
      policyId,
      versionId,
    }: {
      policyId: string;
      versionId: string;
    }) => acknowledgePolicy(policyId, versionId),
    retry: false,
    onSuccess: () => client.invalidateQueries({ queryKey: keys }),
  });
}
