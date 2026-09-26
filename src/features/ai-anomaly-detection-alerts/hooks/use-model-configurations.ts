"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { listModelConfigurations, type ModelConfigurationQuery } from "../api/model-configurations";

const key = ["ai-alerts", "models"] as const;

export function useModelConfigurations(query: ModelConfigurationQuery) {
  return useQuery({
    queryKey: [...key, query],
    queryFn: ({ signal }) => listModelConfigurations(query, signal),
    placeholderData: keepPreviousData,
  });
}
