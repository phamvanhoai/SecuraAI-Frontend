"use client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { cancelRiskAssessment } from "../api/cancel-risk-assessment";

export function useCancelRiskAssessment() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: cancelRiskAssessment,
    onSuccess: async (detail) => {
      client.setQueryData(["risks", "detail", detail.assessment.id], detail);
      await client.invalidateQueries({ queryKey: ["risks", "list"] });
    },
  });
}
