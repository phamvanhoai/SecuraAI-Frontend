"use client";

import { useQuery } from "@tanstack/react-query";
import {
  getCompletionCampaign,
  listCompletionCampaigns,
} from "../api/completion";
import type { CompletionStatus } from "../schemas/completion-schema";

export function useCompletionCampaigns(
  page: number,
  q: string,
  enabled: boolean,
) {
  return useQuery({
    queryKey: ["training", "completion", page, q],
    queryFn: ({ signal }) => listCompletionCampaigns(page, q, signal),
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
    placeholderData: (previous) => previous,
  });
}
