"use client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createRiskAssessment } from "../api/create-risk-assessment";
import { getRiskCreateOptions } from "../api/get-risk-create-options";
export function useCreateRiskAssessment() {
  const client = useQueryClient();
  return useMutation({ mutationFn: createRiskAssessment, onSuccess: async () => {
    await Promise.all([client.invalidateQueries({ queryKey: ["risk-register"] }), client.invalidateQueries({ queryKey: ["risks", "list"] })]);
  } });
}
export function useRiskCreateOptions(enabled: boolean) {
  return useQuery({ queryKey: ["risks", "create-options"], queryFn: ({ signal }) => getRiskCreateOptions(signal), enabled, staleTime: 60_000 });
}
