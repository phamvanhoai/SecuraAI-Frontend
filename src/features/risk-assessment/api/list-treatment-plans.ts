import { ApiError } from "@/lib/api/api-error";
import { apiRequest } from "@/lib/api/api-client";
import {
  treatmentPlanListResponseSchema,
  type TreatmentPlanListQuery,
  type TreatmentPlanListResponse,
} from "../schemas/treatment-plan-list-schema";

export async function listTreatmentPlans(
  query: TreatmentPlanListQuery,
  signal?: AbortSignal,
): Promise<TreatmentPlanListResponse> {
  const data = await apiRequest<unknown>("/api/risks/treatment-plans", {
    method: "GET",
    target: "same-origin",
    query,
    ...(signal ? { signal } : {}),
  });
  const parsed = treatmentPlanListResponseSchema.safeParse(data);
  if (!parsed.success)
    throw new ApiError(
      "The treatment plan response has an invalid format.",
      502,
      "UNKNOWN_ERROR",
      parsed.error.flatten(),
    );
  return parsed.data;
}
