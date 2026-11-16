"use client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ApiError } from "@/lib/api/api-error";
import {
  createRiskTreatmentPlan,
  getRiskTreatmentPlanOptions,
} from "../api/create-risk-treatment-plan";
export function useRiskTreatmentPlanOptions(
  riskId: string | null,
  q = "",
  enabled = true,
) {
  return useQuery({
    queryKey: ["risk-treatment-plan-options", riskId, q],
    queryFn: ({ signal }) =>
      getRiskTreatmentPlanOptions(riskId ?? "", signal, q),
    enabled: Boolean(riskId) && enabled,
    staleTime: 60_000,
  });
}
export function useCreateRiskTreatmentPlan() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: createRiskTreatmentPlan,
    onError: async (error) => {
      if (error instanceof ApiError && [403, 409].includes(error.status))
        await client.invalidateQueries({ queryKey: ["risk-register"] });
    },
    onSuccess: async () => {
      await Promise.all([
        client.invalidateQueries({ queryKey: ["risk-register"] }),
        client.invalidateQueries({ queryKey: ["treatment-plans"] }),
      ]);
    },
  });
}
