"use client";
import { useQuery } from "@tanstack/react-query";
import { getRiskAssessmentDetail } from "../api/get-risk-assessment-detail";

export function useRiskAssessmentDetail(id: string | null) {
  return useQuery({
    queryKey: ["risks", "detail", id],
    queryFn: ({ signal }) => getRiskAssessmentDetail(id ?? "", signal),
    enabled: id !== null,
  });
}
