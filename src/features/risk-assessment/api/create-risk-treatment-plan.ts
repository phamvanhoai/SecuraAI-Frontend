import { apiRequest } from "@/lib/api/api-client";
import {
  treatmentPlanOptionsSchema,
  type CreateRiskTreatmentPlan,
} from "../schemas/create-risk-treatment-plan-schema";

export async function getRiskTreatmentPlanOptions(
  riskId: string,
  signal?: AbortSignal,
  q = "",
) {
  return treatmentPlanOptionsSchema.parse(
    await apiRequest<unknown>(
      `/api/risks/treatment-plans/create-options?riskId=${encodeURIComponent(riskId)}&limit=10&q=${encodeURIComponent(q)}`,
      { target: "same-origin", ...(signal ? { signal } : {}) },
    ),
  );
}
export async function createRiskTreatmentPlan(input: CreateRiskTreatmentPlan) {
  return apiRequest<unknown>("/api/risks/treatment-plans", {
    method: "POST",
    target: "same-origin",
    body: input,
  });
}
