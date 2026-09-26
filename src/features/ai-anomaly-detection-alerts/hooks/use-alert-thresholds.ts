"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  configureDetectionThreshold,
  getDetectionThreshold,
  listAlertThresholdAssetOptions,
  listAlertThresholds,
  setAlertThreshold,
} from "../api/alert-thresholds";
import type {
  ConfigureDetectionThresholdRequest,
  SetAlertThresholdRequest,
} from "../schemas/alert-threshold-schema";

const queryKey = ["ai-alerts", "detection-threshold"] as const;

export function useDetectionThreshold(enabled: boolean) {
  return useQuery({
    queryKey,
    queryFn: ({ signal }) => getDetectionThreshold(signal),
    enabled,
  });
}

export function useAlertThresholds(page: number, enabled: boolean) {
  return useQuery({
    queryKey: ["ai-alerts", "asset-thresholds", page],
    queryFn: ({ signal }) => listAlertThresholds(page, signal),
    enabled,
  });
}
export function useAlertThresholdAssetOptions(enabled: boolean) {
  return useQuery({
    queryKey: ["ai-alerts", "asset-threshold-options"],
    queryFn: ({ signal }) => listAlertThresholdAssetOptions(signal),
    enabled,
  });
}
export function useSetAlertThreshold() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      assetId,
      input,
    }: {
      assetId: string;
      input: SetAlertThresholdRequest;
    }) => setAlertThreshold(assetId, input),
    onSuccess: async () =>
      queryClient.invalidateQueries({
        queryKey: ["ai-alerts", "asset-thresholds"],
      }),
    retry: false,
  });
}

export function useConfigureDetectionThreshold() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: ConfigureDetectionThresholdRequest) =>
      configureDetectionThreshold(input),
    onSuccess: (data) => queryClient.setQueryData(queryKey, data),
    retry: false,
  });
}
