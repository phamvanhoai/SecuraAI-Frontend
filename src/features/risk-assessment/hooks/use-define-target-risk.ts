"use client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ApiError } from "@/lib/api/api-error";
import { defineTargetRisk } from "../api/define-target-risk";
import type { DefineTargetRiskInput } from "../schemas/define-target-risk-schema";
export function useDefineTargetRisk(riskId: string | null) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (input: DefineTargetRiskInput) =>
      defineTargetRisk(riskId ?? "", input),
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
