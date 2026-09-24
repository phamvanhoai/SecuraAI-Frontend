import { useQuery } from "@tanstack/react-query";
import { getTreatmentPlanDetail } from "../api/get-treatment-plan-detail";

export function useTreatmentPlanDetail(id: string, enabled: boolean) {
  return useQuery({
    queryKey: ["risk-treatment-plan", id],
    queryFn: ({ signal }) => getTreatmentPlanDetail(id, signal),
    enabled: enabled && Boolean(id),
  });
}
