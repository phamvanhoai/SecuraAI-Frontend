import { apiRequest } from "@/lib/api/api-client";
import type { UpdateRiskTreatmentPlan } from "../schemas/update-risk-treatment-plan-schema";
export function updateRiskTreatmentPlan(id: string, input: UpdateRiskTreatmentPlan) { return apiRequest<unknown>(`/api/risks/treatment-plans/${encodeURIComponent(id)}`, { method: "PATCH", target: "same-origin", body: input }); }
