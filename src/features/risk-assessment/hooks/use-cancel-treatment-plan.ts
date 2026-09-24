"use client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { cancelTreatmentPlan } from "../api/cancel-treatment-plan";

export function useCancelTreatmentPlan(id: string) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: cancelTreatmentPlan,
    onSuccess: async (plan) => {
      client.setQueryData(["risk-treatment-plan", id], plan);
      await Promise.all([
        client.invalidateQueries({ queryKey: ["treatment-plans"] }),
        client.invalidateQueries({ queryKey: ["risks"] }),
      ]);
    },
  });
}
