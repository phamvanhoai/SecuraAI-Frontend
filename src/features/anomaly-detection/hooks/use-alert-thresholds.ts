"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { listAlertThresholds, setAlertThreshold } from "../api/alert-thresholds";
import type { SetAlertThresholdRequest } from "../schemas/alert-threshold-schema";

export function useAlertThresholds(page: number, enabled: boolean) {
  return useQuery({
    queryKey: ["ai-alerts", "thresholds", page],
    queryFn: ({ signal }) => listAlertThresholds(page, signal),
    enabled,
  });
}

export function useSetAlertThreshold() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ assetId, input }: { assetId: string; input: SetAlertThresholdRequest }) =>
      setAlertThreshold(assetId, input),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["ai-alerts", "thresholds"] });
    },
    retry: false,
  });
}
