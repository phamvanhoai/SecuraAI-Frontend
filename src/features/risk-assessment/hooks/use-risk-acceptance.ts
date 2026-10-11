"use client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  decideRiskAcceptance,
  submitRiskAcceptance,
} from "../api/risk-acceptance";
import { ApiError } from "@/lib/api/api-error";
export function useSubmitRiskAcceptance(riskId: string) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (input: Parameters<typeof submitRiskAcceptance>[1]) =>
      submitRiskAcceptance(riskId, input),
    onSuccess: () => client.invalidateQueries({ queryKey: ["risk-register"] }),
    onError: async (error) => {
      if (error instanceof ApiError && [403, 409].includes(error.status))
        await client.invalidateQueries({ queryKey: ["risk-register"] });
    },
  });
}
export function useDecideRiskAcceptance(acceptanceId: string) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (input: Parameters<typeof decideRiskAcceptance>[1]) =>
      decideRiskAcceptance(acceptanceId, input),
    onSuccess: () => client.invalidateQueries({ queryKey: ["risk-register"] }),
    onError: async (error) => {
      if (error instanceof ApiError && [403, 409].includes(error.status))
        await client.invalidateQueries({ queryKey: ["risk-register"] });
    },
  });
}
