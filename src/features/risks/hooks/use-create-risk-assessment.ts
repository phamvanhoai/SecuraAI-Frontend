"use client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createRiskAssessment } from "../api/create-risk-assessment";
import { getRiskCreateOptions } from "../api/get-risk-create-options";
export function useCreateRiskAssessment() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: createRiskAssessment,
    onSuccess: async () =>
      client.invalidateQueries({ queryKey: ["risks", "list"] }),
  });
}
export function useRiskCreateOptions(
  type: "assets" | "businessProcesses" | "threats" | "vulnerabilities",
  enabled: boolean,
  q = "",
  page = 1,
) {
  return useQuery({
    queryKey: ["risks", "create-options", type, q, page],
    queryFn: ({ signal }) =>
      getRiskCreateOptions(
        { type, ...(q.trim() ? { q: q.trim() } : {}), page, limit: 20 },
        signal,
      ),
    enabled,
    staleTime: 60_000,
  });
}
