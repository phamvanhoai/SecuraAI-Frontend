"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { withdrawEnrollment } from "../api/completion";
import {
  getCompletionCampaign,
  listCompletionCampaigns,
} from "../api/completion";
import type { CompletionStatus } from "../schemas/completion-schema";

export function useCompletionCampaigns(
  page: number,
  q: string,
  enabled: boolean,
  courseId?: string,
) {
  return useQuery({
    queryKey: ["training", "completion", page, q, courseId],
    queryFn: ({ signal }) => listCompletionCampaigns(page, q, signal, courseId),
    enabled,
  });
}

export function useCompletionCampaign(
  campaignId: string | undefined,
  page: number,
  q: string,
  status: CompletionStatus,
) {
  return useQuery({
    queryKey: ["training", "completion", campaignId, page, q, status],
    queryFn: ({ signal }) =>
      getCompletionCampaign(campaignId ?? "", page, q, status, signal),
    enabled: Boolean(campaignId),
  });
}
export function useWithdrawEnrollment() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      withdrawEnrollment(id, reason),
    retry: false,
    onSuccess: async () => {
      await client.invalidateQueries({ queryKey: ["training"] });
    },
  });
}
