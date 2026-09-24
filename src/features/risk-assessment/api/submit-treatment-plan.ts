import { ApiError } from "@/lib/api/api-error";
import { apiRequest } from "@/lib/api/api-client";
import {
  submittedTreatmentPlanSchema,
  type SubmitTreatmentPlanRequest,
  type SubmittedTreatmentPlan,
} from "../schemas/submit-treatment-plan-schema";

export async function submitTreatmentPlan({
  id,
  input,
}: {
  id: string;
  input: SubmitTreatmentPlanRequest;
}): Promise<SubmittedTreatmentPlan> {
  const data = await apiRequest<unknown>(
    `/api/risks/treatment-plans/${id}/submit`,
    { method: "POST", target: "same-origin", body: input },
  );
  const parsed = submittedTreatmentPlanSchema.safeParse(data);
  if (!parsed.success)
    throw new ApiError(
      "The treatment plan submission response has an invalid format.",
      502,
      "UNKNOWN_ERROR",
      parsed.error.flatten(),
    );
  return parsed.data;
}
