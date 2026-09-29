"use client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { defineTargetRisk } from "../api/define-target-risk";
import type { DefineTargetRiskInput } from "../schemas/define-target-risk-schema";
export function useDefineTargetRisk(riskId: string | null) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (input: DefineTargetRiskInput) =>
      defineTargetRisk(riskId ?? "", input),
    onSuccess: async () =>
      Promise.all([
        client.invalidateQueries({ queryKey: ["risk-register"] }),
        client.invalidateQueries({
          queryKey: ["risk-register", "detail", riskId],
        }),
      ]),
  });
}
