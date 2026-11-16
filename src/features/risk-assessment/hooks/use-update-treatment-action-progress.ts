"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { updateTreatmentActionProgress } from "../api/update-treatment-action-progress";
import { ApiError } from "@/lib/api/api-error";

export function useUpdateTreatmentActionProgress(treatmentPlanId: string) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: updateTreatmentActionProgress,
    onError: async (error) => {
      if (error instanceof ApiError && [403, 409].includes(error.status))
        await Promise.all([
          client.invalidateQueries({ queryKey: ["risk-register"] }),
          client.invalidateQueries({ queryKey: ["risk-treatment-plan", treatmentPlanId] }),
        ]);
    },
    onSuccess: async () => {
      await Promise.all([
        client.invalidateQueries({
          queryKey: ["risk-treatment-plan", treatmentPlanId],
        }),
        client.invalidateQueries({ queryKey: ["treatment-plans"] }),
        client.invalidateQueries({ queryKey: ["risks"] }),
      ]);
    },
  });
}
