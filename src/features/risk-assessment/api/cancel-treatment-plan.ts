import { ApiError } from "@/lib/api/api-error";
import { apiRequest } from "@/lib/api/api-client";
import {
  cancelledTreatmentPlanSchema,
  type CancelTreatmentPlanRequest,
} from "../schemas/cancel-treatment-plan-schema";
import type { TreatmentPlanDetail } from "../schemas/treatment-plan-detail-schema";

export async function cancelTreatmentPlan(input: {
  id: string;
  data: CancelTreatmentPlanRequest;
}): Promise<TreatmentPlanDetail> {
  const result = await apiRequest<unknown>(
    `/api/risks/treatment-plans/${encodeURIComponent(input.id)}/cancel`,
    { method: "POST", target: "same-origin", body: input.data },
  );
  const parsed = cancelledTreatmentPlanSchema.safeParse(result);
  if (!parsed.success)
    throw new ApiError(
      "The cancelled treatment plan response has an invalid format.",
      502,
      "UNKNOWN_ERROR",
      parsed.error.flatten(),
    );
  return parsed.data;
}
