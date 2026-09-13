"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { updatePolicyAndCreateVersion } from "../api/update-policy-version";
import type { UpdatePolicyVersionRequest } from "../schemas/update-policy-version-schema";

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
