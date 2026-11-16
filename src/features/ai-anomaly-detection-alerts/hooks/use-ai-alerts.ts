"use client";

import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { useEffect } from "react";
import { useState } from "react";
import { env } from "@/lib/env";
import {
  confirmAiAlertAsIncident,
  evaluateAiAlertReliability,
  getAiAlertMetrics,
  getAiAlertExplanation,
  listAiAlertFeedback,
  listAiAlerts,
  issueAiAlertRealtimeTicket,
  markAiAlertFalsePositive,
  markAiAlertFurtherInvestigation,
  regenerateAiAlertExplanation,
  runAnomalyDetection,
  startAiAlertTriage,
  type AiAlertQuery,
} from "../api/ai-alerts";
import type {
  ConfirmAiAlertRequest,
  EvaluateAiAlertReliabilityRequest,
  MarkFalsePositiveRequest,
  MarkFurtherInvestigationRequest,
  RegenerateAlertExplanationRequest,
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

export function useStartAiAlertTriage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (alertId: string) => startAiAlertTriage(alertId),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["ai-alerts", "list"] }),
        queryClient.invalidateQueries({ queryKey: ["ai-alerts", "metrics"] }),
      ]);
    },
    retry: false,
  });
}

export type AiAlertRealtimeStatus =
  "connecting" | "live" | "reconnecting" | "unavailable";

function websocketUrl(path: string): string {
  const backend = new URL(env.NEXT_PUBLIC_API_BASE_URL);
  backend.protocol = backend.protocol === "https:" ? "wss:" : "ws:";
  backend.pathname = path;
  backend.search = "";
  backend.hash = "";
  return backend.toString();
}

export function useAiAlertRealtime(enabled = true): AiAlertRealtimeStatus {
  const queryClient = useQueryClient();
  const [status, setStatus] = useState<AiAlertRealtimeStatus>("connecting");

  useEffect(() => {
    if (!enabled || typeof WebSocket === "undefined") {
      return;
    }

    let socket: WebSocket | null = null;
    let retryTimer: ReturnType<typeof setTimeout> | null = null;
    let stopped = false;
    let retryAttempt = 0;

    const connect = async () => {
      const controller = new AbortController();
      try {
        setStatus(retryAttempt === 0 ? "connecting" : "reconnecting");
        const realtime = await issueAiAlertRealtimeTicket(controller.signal);
        if (stopped) return;
        socket = new WebSocket(websocketUrl(realtime.path), [
          "securaai-alerts.v1",
          `ticket.${realtime.ticket}`,
        ]);
        socket.addEventListener("open", () => {
          retryAttempt = 0;
          setStatus("live");
          // A WebSocket only reports changes that happen after it connects.
          // Reconcile immediately so alerts created while the page was closed,
          // reconnecting, or loading cannot remain hidden behind stale REST data.
          void Promise.all([
            queryClient.invalidateQueries({
              queryKey: ["ai-alerts", "list"],
            }),
            queryClient.invalidateQueries({
              queryKey: ["ai-alerts", "metrics"],
            }),
          ]);
        });
        socket.addEventListener("message", (event) => {
          try {
            const message: unknown = JSON.parse(String(event.data));
            if (
              typeof message === "object" &&
              message !== null &&
              "type" in message &&
              message.type === "ai-alerts.updated"
            ) {
              void Promise.all([
                queryClient.invalidateQueries({
                  queryKey: ["ai-alerts", "list"],
                }),
                queryClient.invalidateQueries({
                  queryKey: ["ai-alerts", "metrics"],
                }),
              ]);
            }
          } catch {
            // Ignore malformed frames; REST remains the source of truth.
          }
        });
        socket.addEventListener("close", () => {
          if (stopped) return;
          retryAttempt += 1;
          setStatus("reconnecting");
          retryTimer = setTimeout(
            () => void connect(),
            Math.min(30_000, 1_000 * 2 ** Math.min(retryAttempt - 1, 5)),
          );
        });
        socket.addEventListener("error", () => socket?.close());
      } catch {
        if (stopped) return;
        retryAttempt += 1;
        setStatus("unavailable");
        retryTimer = setTimeout(
          () => void connect(),
          Math.min(30_000, 1_000 * 2 ** Math.min(retryAttempt - 1, 5)),
        );
      }
    };

    void connect();
    return () => {
      stopped = true;
      if (retryTimer) clearTimeout(retryTimer);
      socket?.close(1000, "Page closed");
    };
  }, [enabled, queryClient]);

  return !enabled || typeof WebSocket === "undefined" ? "unavailable" : status;
}

export function useAiAlerts(
  query: AiAlertQuery,
  enabled = true,
  realtimeConnected = false,
) {
  return useQuery({
    queryKey: ["ai-alerts", "list", query],
    queryFn: ({ signal }) => listAiAlerts(query, signal),
    placeholderData: keepPreviousData,
    // WebSocket invalidates the query for live changes. Poll only while the
    // realtime connection is unavailable so one page never runs both paths.
    refetchInterval: realtimeConnected ? false : 10_000,
    refetchIntervalInBackground: false,
    enabled,
  });
}

export function useAiAlertExplanation(alertId: string | null) {
  return useQuery({
    queryKey: ["ai-alerts", "explanation", alertId],
    queryFn: ({ signal }) => {
      if (!alertId)
        throw new Error("The selected anomaly alert is unavailable.");
      return getAiAlertExplanation(alertId, signal);
    },
    enabled: alertId !== null,
  });
}

export function useRegenerateAiAlertExplanation(alertId: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: RegenerateAlertExplanationRequest) => {
      if (!alertId)
        throw new Error("The selected anomaly alert is unavailable.");
      return regenerateAiAlertExplanation(alertId, input);
    },
    onSuccess: (data) => {
      queryClient.setQueryData(["ai-alerts", "explanation", alertId], data);
    },
    retry: false,
  });
}

export function useEvaluateAiAlertReliability(alertId: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: EvaluateAiAlertReliabilityRequest) => {
      if (!alertId)
        throw new Error("The selected anomaly alert is unavailable.");
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
      if (!alertId)
        throw new Error("The selected anomaly alert is unavailable.");
      return listAiAlertFeedback(alertId, page, signal);
    },
    enabled: enabled && alertId !== null,
    placeholderData: keepPreviousData,
    staleTime: 30_000,
  });
}

export function usePrefetchAiAlertFeedback(alertId: string | null) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!alertId) return;
    void queryClient.prefetchQuery({
      queryKey: ["ai-alerts", "feedback", alertId, 1],
      queryFn: ({ signal }) => listAiAlertFeedback(alertId, 1, signal),
      staleTime: 30_000,
    });
  }, [alertId, queryClient]);
}

export function useAiAlertMetrics(enabled = true, realtimeConnected = false) {
  return useQuery({
    queryKey: ["ai-alerts", "metrics", "24h"],
    queryFn: ({ signal }) => getAiAlertMetrics(signal),
    refetchInterval: realtimeConnected ? false : 10_000,
    refetchIntervalInBackground: false,
    enabled,
  });
}

export function useConfirmAiAlertAsIncident(alertId: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: ConfirmAiAlertRequest) => {
      if (!alertId)
        throw new Error("The selected anomaly alert is unavailable.");
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
      if (!alertId)
        throw new Error("The selected anomaly alert is unavailable.");
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

export function useMarkAiAlertFurtherInvestigation(alertId: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: MarkFurtherInvestigationRequest) => {
      if (!alertId)
        throw new Error("The selected anomaly alert is unavailable.");
      return markAiAlertFurtherInvestigation(alertId, input);
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
