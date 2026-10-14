"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  definePolicyApplicability,
  getPolicyApplicability,
} from "../api/policy-applicability";
import type { DefinePolicyApplicability } from "../schemas/policy-applicability-schema";
import { policyDraftKeys } from "./use-policy-drafts";

const key = (policyId: string, versionId: string) =>
  ["policies", "applicability", policyId, versionId] as const;

export function usePolicyApplicability(
  policyId: string | null,
  versionId: string | null,
) {
  return useQuery({
    queryKey: key(policyId ?? "", versionId ?? ""),
    queryFn: ({ signal }) =>
      getPolicyApplicability(policyId ?? "", versionId ?? "", signal),
    enabled: policyId !== null && versionId !== null,
  });
}

export function useDefinePolicyApplicability(
  policyId: string,
  versionId: string,
) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (body: DefinePolicyApplicability) =>
      definePolicyApplicability(policyId, versionId, body),
    retry: false,
    onSuccess: (data) => {
      client.setQueryData(key(policyId, versionId), data);
      return client.invalidateQueries({ queryKey: policyDraftKeys.all });
    },
  });
}
