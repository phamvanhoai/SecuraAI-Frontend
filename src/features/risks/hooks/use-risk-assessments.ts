"use client";
import { useQuery } from "@tanstack/react-query";
import { listRiskAssessments } from "../api/list-risk-assessments";
import type { RiskListQuery } from "../schemas/risk-list-schema";
export function useRiskAssessments(query: RiskListQuery, enabled = true) {
  return useQuery({
    queryKey: ["risks", "list", query],
    queryFn: ({ signal }) => listRiskAssessments(query, signal),
    enabled,
  });
}
