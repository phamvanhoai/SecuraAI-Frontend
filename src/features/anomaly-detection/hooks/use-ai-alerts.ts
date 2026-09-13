"use client";

import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import {
  confirmAiAlertAsIncident,
  evaluateAiAlertReliability,
  getAiAlertMetrics,
  listAiAlertFeedback,
  listAiAlerts,
  type AiAlertQuery,
} from "../api/ai-alerts";
import type {
  ConfirmAiAlertRequest,
  EvaluateAiAlertReliabilityRequest,
} from "../schemas/ai-alert-schema";

export function useAiAlerts(query: AiAlertQuery) {
  return useQuery({
    queryKey: ["ai-alerts", "list", query],
    queryFn: ({ signal }) => listAiAlerts(query, signal),
    placeholderData: keepPreviousData,
    refetchInterval: 10_000,
    refetchIntervalInBackground: false,
  });
}

export function useEvaluateAiAlertReliability(alertId: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: EvaluateAiAlertReliabilityRequest) => {
      if (!alertId) throw new Error("The selected AI alert is unavailable.");
      return evaluateAiAlertReliability(alertId, input);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ["ai-alerts", "feedback", alertId],
      });
    },
    retry: false,
  });
}

export function useAiAlertFeedback(
  alertId: string | null,
  page: number,
  enabled: boolean,
) {
  return useQuery({
    queryKey: ["ai-alerts", "feedback", alertId, page],
    queryFn: ({ signal }) => {
      if (!alertId) throw new Error("The selected AI alert is unavailable.");
      return listAiAlertFeedback(alertId, page, signal);
    },
    enabled: enabled && alertId !== null,
    placeholderData: keepPreviousData,
  });
}

export function useAiAlertMetrics() {
  return useQuery({
    queryKey: ["ai-alerts", "metrics", "24h"],
    queryFn: ({ signal }) => getAiAlertMetrics(signal),
    refetchInterval: 10_000,
    refetchIntervalInBackground: false,
  });
}

export function useConfirmAiAlertAsIncident(alertId: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: ConfirmAiAlertRequest) => {
      if (!alertId) throw new Error("The selected AI alert is unavailable.");
      return confirmAiAlertAsIncident(alertId, input);
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["ai-alerts", "list"] }),
        queryClient.invalidateQueries({ queryKey: ["ai-alerts", "metrics"] }),
        queryClient.invalidateQueries({
          queryKey: ["ai-alerts", "feedback", alertId],
        }),
      ]);
    },
    retry: false,
  });
}
