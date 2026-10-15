"use client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ApiError } from "@/lib/api/api-error";
import {
  getIncidentAnalysis,
  getAnalysisHistory,
  saveIncidentAnalysis,
} from "../api/incident-analysis";
export function useIncidentAnalysis(id: string | undefined) {
  return useQuery({
    queryKey: ["incidents", "analysis", id],
    queryFn: ({ signal }) => getIncidentAnalysis(id ?? "", signal),
    enabled: Boolean(id),
    retry: false,
  });
}
export function useAnalysisHistory(id: string | undefined, page: number) {
  return useQuery({
    queryKey: ["incidents", "analysis-history", id, page],
    queryFn: ({ signal }) => getAnalysisHistory(id ?? "", page, signal),
    enabled: Boolean(id),
    retry: false,
  });
}
export function useSaveIncidentAnalysis() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: saveIncidentAnalysis,
    retry: false,
    onSuccess: async () => {
      await client.invalidateQueries({ queryKey: ["incidents"] });
      await client.invalidateQueries({
        queryKey: ["incidents", "analysis-history"],
        refetchType: "all",
      });
    },
    onError: (error) => {
      if (error instanceof ApiError && [403, 404, 409].includes(error.status))
        void client.invalidateQueries({ queryKey: ["incidents"] });
    },
  });
}
