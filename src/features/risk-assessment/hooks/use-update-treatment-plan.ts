"use client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { updateTreatmentPlan } from "../api/update-treatment-plan";

export function useUpdateTreatmentPlan(id: string) {
  const client = useQueryClient();
  return useMutation({ mutationFn: updateTreatmentPlan, onSuccess: async () => {
    await Promise.all([
      client.invalidateQueries({ queryKey: ["risk-treatment-plan", id] }),
      client.invalidateQueries({ queryKey: ["treatment-plans"] }),
      client.invalidateQueries({ queryKey: ["risks"] }),
    ]);
  } });
}
