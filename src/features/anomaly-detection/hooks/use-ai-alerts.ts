"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";
import {
  getAiAlertMetrics,
  listAiAlerts,
  type AiAlertQuery,
} from "../api/ai-alerts";

export function useAiAlerts(query: AiAlertQuery) {
  return useQuery({
    queryKey: ["ai-alerts", "list", query],
    queryFn: ({ signal }) => listAiAlerts(query, signal),
    placeholderData: keepPreviousData,
    refetchInterval: 10_000,
    refetchIntervalInBackground: false,
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
