import { apiRequest } from "@/lib/api/api-client";
import { treatmentPlanOptionsSchema, type CreateRiskTreatmentPlan } from "../schemas/create-risk-treatment-plan-schema";

export async function getRiskTreatmentPlanOptions(signal?: AbortSignal) {
  return treatmentPlanOptionsSchema.parse(await apiRequest<unknown>("/api/risks/treatment-plans/create-options?limit=100", { target: "same-origin", ...(signal ? { signal } : {}) }));
}
export async function createRiskTreatmentPlan(input: CreateRiskTreatmentPlan) {
  return apiRequest<unknown>("/api/risks/treatment-plans", { method: "POST", target: "same-origin", body: input });
}
