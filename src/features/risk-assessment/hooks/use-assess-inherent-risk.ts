"use client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ApiError } from "@/lib/api/api-error";
import { assessInherentRisk } from "../api/assess-inherent-risk";
import type { AssessInherentRiskInput } from "../schemas/assess-inherent-risk-schema";
export function useAssessInherentRisk(riskId: string | null) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (input: AssessInherentRiskInput) =>
      assessInherentRisk(riskId ?? "", input),
    onError: async (error) => {
      if (error instanceof ApiError && error.status === 409) {
        await client.invalidateQueries({ queryKey: ["risk-register"] });
      }
    },
    onSuccess: async () =>
      Promise.all([
        client.invalidateQueries({ queryKey: ["risk-register"] }),
        client.invalidateQueries({
          queryKey: ["risk-register", "detail", riskId],
        }),
      ]),
  });
}
