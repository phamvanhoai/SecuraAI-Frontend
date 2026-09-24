"use client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { submitTreatmentPlan } from "../api/submit-treatment-plan";

export function useSubmitTreatmentPlan() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: submitTreatmentPlan,
    onSuccess: async (result) => {
      await Promise.all([
        client.invalidateQueries({
          queryKey: ["risks", "detail", result.riskAssessmentId],
        }),
        client.invalidateQueries({ queryKey: ["risks", "list"] }),
      ]);
    },
  });
}
