import { ApiError } from "@/lib/api/api-error";
import { apiRequest } from "@/lib/api/api-client";
import {
  approvedTreatmentPlanSchema,
  type ApprovedTreatmentPlan,
  type ApproveTreatmentPlanRequest,
} from "../schemas/approve-treatment-plan-schema";

export async function approveTreatmentPlan({ id, input }: {
  id: string;
  input: ApproveTreatmentPlanRequest;
}): Promise<ApprovedTreatmentPlan> {
  const data = await apiRequest<unknown>(`/api/risks/treatment-plans/${id}/approve`, {
    method: "POST",
    target: "same-origin",
    body: input,
  });
  const parsed = approvedTreatmentPlanSchema.safeParse(data);
  if (!parsed.success)
    throw new ApiError(
      "The treatment plan approval response has an invalid format.",
      502,
      "UNKNOWN_ERROR",
      parsed.error.flatten(),
    );
  return parsed.data;
}
