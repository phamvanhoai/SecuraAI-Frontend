"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createTreatmentPlan } from "../api/create-treatment-plan";
import { getTreatmentPlanCreateOptions } from "../api/get-treatment-plan-create-options";

export function useCreateTreatmentPlan(riskAssessmentId: string) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: createTreatmentPlan,
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

export function useTreatmentPlanCreateOptions(
  enabled: boolean,
  q: string,
  page: number,
) {
  return useQuery({
    queryKey: ["treatment-plans", "create-options", q, page],
    queryFn: ({ signal }) =>
      getTreatmentPlanCreateOptions(
        { ...(q.trim() ? { q: q.trim() } : {}), page, limit: 20 },
        signal,
      ),
    enabled,
    staleTime: 60_000,
  });
}
