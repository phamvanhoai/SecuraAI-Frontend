"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { updateTreatmentActionProgress } from "../api/update-treatment-action-progress";

export function useUpdateTreatmentActionProgress(treatmentPlanId: string) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: updateTreatmentActionProgress,
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
