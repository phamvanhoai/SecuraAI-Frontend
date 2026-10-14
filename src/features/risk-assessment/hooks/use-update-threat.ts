"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ApiError } from "@/lib/api/api-error";
import { updateThreat } from "../api/update-threat";
import type { UpdateThreatInput } from "../schemas/update-threat-schema";

export function useUpdateThreat(riskId: string, threatId: string) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (input: UpdateThreatInput) => updateThreat(riskId, threatId, input),
    onError: async (error) => {
      if (error instanceof ApiError && [403, 409].includes(error.status))
        await client.invalidateQueries({ queryKey: ["risk-register"] });
    },
    onSuccess: async () =>
      Promise.all([
        client.invalidateQueries({ queryKey: ["risk-register"] }),
        client.invalidateQueries({ queryKey: ["risk-register", "detail", riskId] }),
      ]),
  });
}
