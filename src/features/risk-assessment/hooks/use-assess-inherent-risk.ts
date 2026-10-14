"use client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { assessInherentRisk } from "../api/assess-inherent-risk";
import type { AssessInherentRiskInput } from "../schemas/assess-inherent-risk-schema";
export function useAssessInherentRisk(riskId: string | null) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (input: AssessInherentRiskInput) =>
      assessInherentRisk(riskId ?? "", input),
    onSuccess: async () =>
      Promise.all([
        client.invalidateQueries({ queryKey: ["risk-register"] }),
        client.invalidateQueries({
          queryKey: ["risk-register", "detail", riskId],
        }),
      ]),
  });
}
