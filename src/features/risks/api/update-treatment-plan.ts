import { ApiError } from "@/lib/api/api-error";
import { apiRequest } from "@/lib/api/api-client";
import type { TreatmentPlanDetail } from "../schemas/treatment-plan-detail-schema";
import { updatedTreatmentPlanSchema, type UpdateTreatmentPlanRequest } from "../schemas/update-treatment-plan-schema";

export async function updateTreatmentPlan(input: { id: string; data: UpdateTreatmentPlanRequest }): Promise<TreatmentPlanDetail> {
  const result = await apiRequest<unknown>(`/api/risks/treatment-plans/${encodeURIComponent(input.id)}`, { method: "PATCH", target: "same-origin", body: input.data });
  const parsed = updatedTreatmentPlanSchema.safeParse(result);
  if (!parsed.success) throw new ApiError("The updated treatment plan response has an invalid format.", 502, "UNKNOWN_ERROR", parsed.error.flatten());
  return parsed.data;
}
