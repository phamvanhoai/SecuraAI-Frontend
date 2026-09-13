"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  listPublishedPoliciesForNewVersion,
  updatePolicyAndCreateVersion,
} from "../api/update-policy-version";
import type { UpdatePolicyVersionRequest } from "../schemas/update-policy-version-schema";

export function usePublishedPoliciesForNewVersion(enabled: boolean) {
  return useQuery({
    queryKey: ["policies", "published", "mine"],
    queryFn: ({ signal }) => listPublishedPoliciesForNewVersion(signal),
    enabled,
  });
}

export function useUpdatePolicyVersion() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      policyId,
      input,
    }: {
      policyId: string;
      input: UpdatePolicyVersionRequest;
    }) => updatePolicyAndCreateVersion(policyId, input),
    retry: false,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["policies"] }),
  });
}
