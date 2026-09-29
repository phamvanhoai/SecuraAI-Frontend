"use client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { assessResidualRisk } from "../api/assess-residual-risk";
import type { AssessResidualRiskInput } from "../schemas/assess-residual-risk-schema";
export function useAssessResidualRisk(riskId: string | null) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (input: AssessResidualRiskInput) =>
      assessResidualRisk(riskId ?? "", input),
    onSuccess: async () =>
      Promise.all([
        client.invalidateQueries({ queryKey: ["risk-register"] }),
        client.invalidateQueries({
          queryKey: ["risk-register", "detail", riskId],
        }),
      ]),
  });
}
