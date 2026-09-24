"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  listComplianceFrameworks,
  listFrameworkControls,
  listPolicyControlMappings,
  replacePolicyControlMappings,
} from "../api/policy-control-mappings";
import type {
  FrameworkControlsQuery,
  PolicyControlMappingQuery,
} from "../schemas/policy-control-mapping-schema";

const keys = ["policies", "control-mappings"] as const;

export function usePolicyControlMappings(
  query: PolicyControlMappingQuery,
  enabled: boolean,
) {
  return useQuery({
    queryKey: [...keys, "list", query],
    queryFn: ({ signal }) => listPolicyControlMappings(query, signal),
    enabled,
  });
}

export function useComplianceFrameworks(enabled: boolean) {
  return useQuery({
    queryKey: [...keys, "frameworks"],
    queryFn: ({ signal }) => listComplianceFrameworks(signal),
    enabled,
  });
}

export function useFrameworkControls(
  frameworkId: string | undefined,
  query: FrameworkControlsQuery,
) {
  return useQuery({
    queryKey: [...keys, "frameworks", frameworkId, "controls", query],
    queryFn: ({ signal }) =>
      listFrameworkControls(frameworkId ?? "", query, signal),
    enabled: Boolean(frameworkId),
  });
}

export function useReplacePolicyControlMappings() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: replacePolicyControlMappings,
    retry: false,
    onSuccess: () => client.invalidateQueries({ queryKey: keys }),
  });
}
