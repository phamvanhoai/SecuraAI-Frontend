"use client";
import { useQuery } from "@tanstack/react-query";
import {
  getPolicyVersionHistoryDetail,
  listPolicyVersionHistory,
} from "../api/policy-version-history";
import type { PolicyVersionHistoryQuery } from "../schemas/policy-version-history-schema";

export const usePolicyVersionHistory = (query: PolicyVersionHistoryQuery) =>
  useQuery({
    queryKey: ["policies", "version-history", query],
    queryFn: ({ signal }) => listPolicyVersionHistory(query, signal),
    retry: false,
  });
export const usePolicyVersionHistoryDetail = (
  policyId: string | null,
  versionId: string | null,
) =>
  useQuery({
    queryKey: ["policies", "version-history", "detail", policyId, versionId],
    queryFn: ({ signal }) =>
      getPolicyVersionHistoryDetail(policyId ?? "", versionId ?? "", signal),
    enabled: policyId !== null && versionId !== null,
    retry: false,
  });
