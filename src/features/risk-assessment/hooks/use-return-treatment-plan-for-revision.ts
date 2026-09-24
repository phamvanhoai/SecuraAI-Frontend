"use client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { returnTreatmentPlanForRevision } from "../api/return-treatment-plan-for-revision";

export function useReturnTreatmentPlanForRevision() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: returnTreatmentPlanForRevision,
    onSuccess: async (result) => {
      await Promise.all([
        client.invalidateQueries({ queryKey: ["risks", "detail", result.riskAssessmentId] }),
        client.invalidateQueries({ queryKey: ["risks", "list"] }),
        client.invalidateQueries({ queryKey: ["risks", "treatment-plans"] }),
      ]);
    },
  });
}
