"use client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { updateRiskTreatmentPlan } from "../api/update-risk-treatment-plan";
import { ApiError } from "@/lib/api/api-error";
export function useUpdateRiskTreatmentPlan(id: string) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (input: Parameters<typeof updateRiskTreatmentPlan>[1]) =>
      updateRiskTreatmentPlan(id, input),
    onSuccess: async () => {
      await Promise.all([
        client.invalidateQueries({ queryKey: ["risk-register"] }),
        client.invalidateQueries({ queryKey: ["treatment-plans"] }),
      ]);
    },
    onError: async (error) => {
      if (error instanceof ApiError && [403, 409].includes(error.status))
        await Promise.all([
          client.invalidateQueries({ queryKey: ["risk-register"] }),
          client.invalidateQueries({ queryKey: ["treatment-plans"] }),
        ]);
    },
  });
}
