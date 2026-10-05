"use client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ApiError } from "@/lib/api/api-error";
import { assessResidualRisk } from "../api/assess-residual-risk";
import type { AssessResidualRiskInput } from "../schemas/assess-residual-risk-schema";
export function useAssessResidualRisk(riskId: string | null) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (input: AssessResidualRiskInput) =>
      assessResidualRisk(riskId ?? "", input),
    onError: async (error) => {
      if (error instanceof ApiError && [403, 409].includes(error.status))
        await client.invalidateQueries({ queryKey: ["risk-register"] });
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
