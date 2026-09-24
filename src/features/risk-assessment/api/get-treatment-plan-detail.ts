import { ApiError } from "@/lib/api/api-error";
import { apiRequest } from "@/lib/api/api-client";
import {
  treatmentPlanDetailSchema,
  type TreatmentPlanDetail,
} from "../schemas/treatment-plan-detail-schema";

export async function getTreatmentPlanDetail(
  id: string,
  signal?: AbortSignal,
): Promise<TreatmentPlanDetail> {
  const data = await apiRequest<unknown>(
    `/api/risks/treatment-plans/${encodeURIComponent(id)}`,
    {
      method: "GET",
      target: "same-origin",
      ...(signal ? { signal } : {}),
    },
  );
  const parsed = treatmentPlanDetailSchema.safeParse(data);
  if (!parsed.success)
    throw new ApiError(
      "The treatment plan detail has an invalid format.",
      502,
      "UNKNOWN_ERROR",
      parsed.error.flatten(),
    );
  return parsed.data;
}
