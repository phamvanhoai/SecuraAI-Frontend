import { ApiError } from "@/lib/api/api-error";
import { apiRequest } from "@/lib/api/api-client";
import {
  updateTreatmentActionProgressRequestSchema,
  updateTreatmentActionProgressResponseSchema,
  type UpdateTreatmentActionProgressRequest,
  type UpdatedTreatmentActionProgress,
} from "../schemas/update-treatment-action-progress-schema";

export async function updateTreatmentActionProgress(input: {
  treatmentPlanId: string;
  actionId: string;
  data: UpdateTreatmentActionProgressRequest;
}): Promise<UpdatedTreatmentActionProgress> {
  const request = updateTreatmentActionProgressRequestSchema.parse(input.data);
  const result = await apiRequest<unknown>(
    `/api/risks/treatment-plans/${encodeURIComponent(input.treatmentPlanId)}/actions/${encodeURIComponent(input.actionId)}/progress`,
    { method: "PATCH", target: "same-origin", body: request },
  );
  const parsed = updateTreatmentActionProgressResponseSchema.safeParse(result);
  if (!parsed.success)
    throw new ApiError(
      "The treatment action progress response has an invalid format.",
      502,
      "UNKNOWN_ERROR",
      parsed.error.flatten(),
    );
  return parsed.data;
}
