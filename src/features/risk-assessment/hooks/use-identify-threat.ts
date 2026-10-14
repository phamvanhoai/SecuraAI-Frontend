"use client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { identifyThreat } from "../api/identify-threat";
import type { IdentifyThreatInput } from "../schemas/identify-threat-schema";

export function useIdentifyThreat(riskId: string | null) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (input: IdentifyThreatInput) =>
      identifyThreat(riskId ?? "", input),
    onSuccess: async () =>
      Promise.all([
        client.invalidateQueries({ queryKey: ["risk-register"] }),
        client.invalidateQueries({
          queryKey: ["risk-register", "detail", riskId],
        }),
      ]),
  });
}
