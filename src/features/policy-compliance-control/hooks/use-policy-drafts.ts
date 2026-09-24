"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createPolicyDraft,
  getPolicyDraft,
  listPolicyDrafts,
  updatePolicyDraft,
} from "../api/policy-drafts";
import type {
  CreatePolicyDraftRequest,
  PolicyDraftQuery,
  UpdatePolicyDraftRequest,
} from "../schemas/policy-draft-schema";

export const policyDraftKeys = {
  all: ["policies", "drafts"] as const,
  list: (query: PolicyDraftQuery) =>
    [...policyDraftKeys.all, "list", query] as const,
  detail: (policyId: string, versionId: string) =>
    [...policyDraftKeys.all, "detail", policyId, versionId] as const,
};

export function usePolicyDrafts(query: PolicyDraftQuery, enabled: boolean) {
  return useQuery({
    queryKey: policyDraftKeys.list(query),
    queryFn: ({ signal }) => listPolicyDrafts(query, signal),
    enabled,
  });
}

export function usePolicyDraft(
  policyId: string | null,
  versionId: string | null,
) {
  return useQuery({
    queryKey: policyDraftKeys.detail(policyId ?? "", versionId ?? ""),
    queryFn: ({ signal }) =>
      getPolicyDraft(policyId ?? "", versionId ?? "", signal),
    enabled: policyId !== null && versionId !== null,
  });
}

export function useCreatePolicyDraft() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreatePolicyDraftRequest) => createPolicyDraft(input),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: policyDraftKeys.all }),
  });
}

export function useUpdatePolicyDraft() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      policyId,
      versionId,
      input,
    }: {
      policyId: string;
      versionId: string;
      input: UpdatePolicyDraftRequest;
    }) => updatePolicyDraft(policyId, versionId, input),
    onSuccess: (draft) => {
      queryClient.setQueryData(
        policyDraftKeys.detail(draft.policyId, draft.version.id),
        draft,
      );
      return queryClient.invalidateQueries({ queryKey: policyDraftKeys.all });
    },
  });
}
