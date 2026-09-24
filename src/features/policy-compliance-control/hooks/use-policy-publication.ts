"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getPolicyReview,
  listPublishablePolicies,
  publishPolicyVersion,
} from "../api/policy-publication";
import type { PublishablePolicyQuery } from "../schemas/policy-publication-schema";

const publicationKeys = ["policies", "publication"] as const;

export function usePublishablePolicies(query: PublishablePolicyQuery) {
  return useQuery({
    queryKey: [...publicationKeys, "list", query],
    queryFn: ({ signal }) => listPublishablePolicies(query, signal),
  });
}

export function usePolicyReview(
  policyId: string | null,
  versionId: string | null,
) {
  return useQuery({
    queryKey: [...publicationKeys, "detail", policyId, versionId],
    queryFn: ({ signal }) =>
      getPolicyReview(policyId ?? "", versionId ?? "", signal),
    enabled: policyId !== null && versionId !== null,
  });
}

export function usePublishPolicyVersion() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: publishPolicyVersion,
    onSuccess: () => client.invalidateQueries({ queryKey: publicationKeys }),
  });
}
