"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  listOwnedRiskReassessmentRequests,
  startRiskReassessmentReview,
  completeRiskReassessment,
} from "../api/risk-reassessment-review";

const key = ["risks", "reassessment-requests", "mine"] as const;

export function useOwnedRiskReassessmentRequests(enabled: boolean) {
  return useQuery({
    queryKey: key,
    queryFn: ({ signal }) => listOwnedRiskReassessmentRequests(signal),
    enabled,
    retry: false,
  });
}

export function useCompleteRiskReassessment() {
  const client = useQueryClient();
  return useMutation({ mutationFn: completeRiskReassessment, retry: false, onSuccess: () => {
    void client.invalidateQueries({ queryKey: key });
    void client.invalidateQueries({ queryKey: ["risks"] });
  } });
}

export function useStartRiskReassessmentReview() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: startRiskReassessmentReview,
    retry: false,
    onSuccess: () => {
      void client.invalidateQueries({ queryKey: key });
      void client.invalidateQueries({ queryKey: ["risks"] });
    },
  });
}
