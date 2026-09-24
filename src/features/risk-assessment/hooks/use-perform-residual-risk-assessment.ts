"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { performResidualRiskAssessment } from "../api/perform-residual-risk-assessment";

export function usePerformResidualRiskAssessment(riskAssessmentId: string) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: performResidualRiskAssessment,
    onSuccess: async () => {
      await Promise.all([
        client.invalidateQueries({
          queryKey: ["risks", "detail", riskAssessmentId],
        }),
        client.invalidateQueries({ queryKey: ["risks", "list"] }),
        client.invalidateQueries({ queryKey: ["treatment-plans"] }),
      ]);
    },
  });
}
