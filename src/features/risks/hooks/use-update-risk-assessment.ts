"use client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { updateRiskAssessment } from "../api/update-risk-assessment";
export function useUpdateRiskAssessment() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: updateRiskAssessment,
    onSuccess: async (detail) => {
      client.setQueryData(["risks", "detail", detail.assessment.id], detail);
      await client.invalidateQueries({ queryKey: ["risks", "list"] });
    },
  });
}
