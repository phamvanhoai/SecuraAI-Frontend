"use client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { approveTreatmentPlan } from "../api/approve-treatment-plan";

export function useApproveTreatmentPlan() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: approveTreatmentPlan,
    onSuccess: async (result) => {
      await Promise.all([
        client.invalidateQueries({ queryKey: ["risks", "detail", result.riskAssessmentId] }),
        client.invalidateQueries({ queryKey: ["risks", "list"] }),
      ]);
    },
  });
}
