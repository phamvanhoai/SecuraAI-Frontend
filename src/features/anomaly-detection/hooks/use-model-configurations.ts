"use client";
import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import {
  activateModelConfiguration,
  createModelConfiguration,
  getModelConfigurationMetrics,
  listModelConfigurations,
  type ModelConfigurationQuery,
} from "../api/model-configurations";
const key = ["ai-alerts", "models"] as const;
const metricsKey = [...key, "metrics"] as const;
export function useModelConfigurations(query: ModelConfigurationQuery) {
  return useQuery({
    queryKey: [...key, query],
    queryFn: ({ signal }) => listModelConfigurations(query, signal),
    placeholderData: keepPreviousData,
  });
}

export function useModelConfigurationMetrics() {
  return useQuery({
    queryKey: metricsKey,
    queryFn: ({ signal }) => getModelConfigurationMetrics(signal),
  });
}
export function useCreateModelConfiguration() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: createModelConfiguration,
    onSuccess: () => client.invalidateQueries({ queryKey: key }),
  });
}
export function useActivateModelConfiguration() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: activateModelConfiguration,
    onSuccess: () => client.invalidateQueries({ queryKey: key }),
  });
}
