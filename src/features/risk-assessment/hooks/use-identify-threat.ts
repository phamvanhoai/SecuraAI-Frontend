"use client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { identifyThreat } from "../api/identify-threat";
import type { IdentifyThreatInput } from "../schemas/identify-threat-schema";
import { ApiError } from "@/lib/api/api-error";

export function useIdentifyThreat(riskId: string | null) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (input: IdentifyThreatInput) =>
      identifyThreat(riskId ?? "", input),
    onError: async (error) => {
      if (error instanceof ApiError && [403, 409].includes(error.status)) {
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
