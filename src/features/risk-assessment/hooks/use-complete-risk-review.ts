"use client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { completeRiskReview } from "../api/complete-risk-review";
export function useCompleteRiskReview(riskId: string) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (input: Parameters<typeof completeRiskReview>[1]) => completeRiskReview(riskId, input),
    onSettled: () => client.invalidateQueries({ queryKey: ["risk-register"] }),
  });
}
