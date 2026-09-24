import { ApiError } from "@/lib/api/api-error";
import { apiRequest } from "@/lib/api/api-client";
import {
  returnedTreatmentPlanForRevisionSchema,
  type ReturnedTreatmentPlanForRevision,
  type ReturnTreatmentPlanForRevisionRequest,
} from "../schemas/return-treatment-plan-for-revision-schema";

export async function returnTreatmentPlanForRevision({ id, input }: {
  id: string;
  input: ReturnTreatmentPlanForRevisionRequest;
}): Promise<ReturnedTreatmentPlanForRevision> {
  const data = await apiRequest<unknown>(
    `/api/risks/treatment-plans/${id}/return-for-revision`,
    { method: "POST", target: "same-origin", body: input },
  );
  const parsed = returnedTreatmentPlanForRevisionSchema.safeParse(data);
  if (!parsed.success)
    throw new ApiError(
      "The revision response has an invalid format.",
      502,
      "UNKNOWN_ERROR",
      parsed.error.flatten(),
    );
  return parsed.data;
}
