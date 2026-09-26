"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { configureDetectionThreshold, getDetectionThreshold } from "../api/alert-thresholds";
import type { ConfigureDetectionThresholdRequest } from "../schemas/alert-threshold-schema";

const queryKey = ["ai-alerts", "detection-threshold"] as const;

export function useDetectionThreshold(enabled: boolean) {
  return useQuery({ queryKey, queryFn: ({ signal }) => getDetectionThreshold(signal), enabled });
}

export function useConfigureDetectionThreshold() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: ConfigureDetectionThresholdRequest) => configureDetectionThreshold(input),
    onSuccess: (data) => queryClient.setQueryData(queryKey, data),
    retry: false,
  });
}
