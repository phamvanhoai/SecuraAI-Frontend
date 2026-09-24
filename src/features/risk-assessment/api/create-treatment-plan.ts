import { ApiError } from "@/lib/api/api-error";
import { apiRequest } from "@/lib/api/api-client";
import type { TreatmentPlanDetail } from "../schemas/treatment-plan-detail-schema";
import {
  createdTreatmentPlanSchema,
  type CreateTreatmentPlanRequest,
} from "../schemas/create-treatment-plan-schema";

export async function createTreatmentPlan(
  input: CreateTreatmentPlanRequest,
): Promise<TreatmentPlanDetail> {
  const data = await apiRequest<unknown>("/api/risks/treatment-plans", {
    method: "POST",
    target: "same-origin",
    body: input,
  });
  const parsed = createdTreatmentPlanSchema.safeParse(data);
  if (!parsed.success)
    throw new ApiError(
      "The created treatment plan response has an invalid format.",
      502,
      "UNKNOWN_ERROR",
      parsed.error.flatten(),
    );
  return parsed.data;
}
