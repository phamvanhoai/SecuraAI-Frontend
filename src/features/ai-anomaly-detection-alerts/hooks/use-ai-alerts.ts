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
  getAiAlertExplanation,
  listAiAlertFeedback,
  listAiAlerts,
  markAiAlertFalsePositive,
  runAnomalyDetection,
  type AiAlertQuery,
} from "../api/ai-alerts";
import type {
  ConfirmAiAlertRequest,
  EvaluateAiAlertReliabilityRequest,
  MarkFalsePositiveRequest,
} from "../schemas/ai-alert-schema";
import type { AnomalyDetectionRunInput } from "../schemas/anomaly-detection-run-schema";

export function useRunAnomalyDetection() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: AnomalyDetectionRunInput) => runAnomalyDetection(input),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["ai-alerts", "list"] }),
        queryClient.invalidateQueries({ queryKey: ["ai-alerts", "metrics"] }),
      ]);
    },
    retry: false,
  });
}

export function useAiAlerts(query: AiAlertQuery, enabled = true) {
  return useQuery({
    queryKey: ["ai-alerts", "list", query],
    queryFn: ({ signal }) => listAiAlerts(query, signal),
    placeholderData: keepPreviousData,
    refetchInterval: 10_000,
    refetchIntervalInBackground: false,
    enabled,
  });
}

export function useAiAlertExplanation(alertId: string | null) {
  return useQuery({
    queryKey: ["ai-alerts", "explanation", alertId],
    queryFn: ({ signal }) => {
      if (!alertId) throw new Error("The selected AI alert is unavailable.");
      return getAiAlertExplanation(alertId, signal);
    },
    enabled: alertId !== null,
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

export function useAiAlertMetrics(enabled = true) {
  return useQuery({
    queryKey: ["ai-alerts", "metrics", "24h"],
    queryFn: ({ signal }) => getAiAlertMetrics(signal),
    refetchInterval: 10_000,
    refetchIntervalInBackground: false,
    enabled,
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

export function useMarkAiAlertFalsePositive(alertId: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: MarkFalsePositiveRequest) => {
      if (!alertId) throw new Error("The selected AI alert is unavailable.");
      return markAiAlertFalsePositive(alertId, input);
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
