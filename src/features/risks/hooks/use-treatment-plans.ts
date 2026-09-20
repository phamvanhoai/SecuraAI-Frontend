"use client";

import { useQuery } from "@tanstack/react-query";
import { listTreatmentPlans } from "../api/list-treatment-plans";
import type { TreatmentPlanListQuery } from "../schemas/treatment-plan-list-schema";

export function useTreatmentPlans(
  query: TreatmentPlanListQuery,
  enabled = true,
) {
  return useQuery({
    queryKey: ["risks", "treatment-plans", "list", query],
    queryFn: ({ signal }) => listTreatmentPlans(query, signal),
    enabled,
  });
}
